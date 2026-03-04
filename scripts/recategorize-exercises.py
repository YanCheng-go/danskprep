#!/usr/bin/env python3
"""
Recategorize exercises by grammar_topic_slug via Claude Code review.

Two-step workflow:
  1. Generate a prompt file with exercises formatted for Claude Code review
  2. Apply the JSON results back to the seed file

Usage:
  cd scripts

  # Step 1: Generate prompt for Claude Code (all exercises or one topic)
  uv run python recategorize-exercises.py
  uv run python recategorize-exercises.py --topic comparative-superlative

  # Step 2: After Claude reviews, save JSON to data/recategorize-changes.json
  uv run python recategorize-exercises.py --apply data/recategorize-changes.json
  uv run python recategorize-exercises.py --apply data/recategorize-changes.json --write

Orchestration:
  The script is designed for human-in-the-loop AI review:

  1. Run without flags → generates prompt file(s) in scripts/data/
  2. Copy the prompt content into Claude Code (or any LLM)
  3. Claude analyzes each exercise and returns a JSON array of changes
  4. Save that JSON to scripts/data/recategorize-changes.json
  5. Run --apply to preview, then --apply --write to commit changes

  Each --write run appends to scripts/data/recategorization-log.jsonl
  so there is a permanent audit trail of all AI-assisted changes.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
SEED_DIR = PROJECT_ROOT / "src" / "data" / "seed"
EXERCISES_FILE = SEED_DIR / "exercises-pd3m2.json"
DATA_DIR = Path(__file__).parent / "data"
LOG_FILE = DATA_DIR / "recategorization-log.jsonl"

VALID_TOPICS = [
    "noun-gender",
    "comparative-superlative",
    "inverted-word-order",
    "main-subordinate-clauses",
    "verbs-tenses",
    "pronouns",
    "adjective-agreement",
]

BATCH_SIZE = 30


# ---------------------------------------------------------------------------
# Prompt generation
# ---------------------------------------------------------------------------
def format_exercise(idx: int, ex: dict) -> str:
    """Format a single exercise as a readable block for Claude."""
    lines = [f"[{idx}] topic={ex['grammar_topic_slug']}  type={ex.get('exercise_type', '?')}"]
    lines.append(f"  Q: {ex.get('question', '')}")
    lines.append(f"  A: {ex.get('correct_answer', '')}")
    hint = ex.get("hint") or ""
    if hint:
        lines.append(f"  Hint: {hint}")
    explanation = ex.get("explanation") or ""
    if explanation:
        lines.append(f"  Explanation: {explanation[:120]}")
    return "\n".join(lines)


def generate_prompt(exercises: list[dict], indices: list[int], batch_num: int, total_batches: int) -> str:
    """Generate a prompt for Claude Code to classify a batch of exercises."""
    topic_list = "\n".join(f"  - {t}" for t in VALID_TOPICS)

    header = f"""## Exercise Recategorization — Batch {batch_num}/{total_batches}

Review each exercise below. For each one, decide whether its `grammar_topic_slug`
is correct. Focus on **what the exercise actually tests** (what is blanked, what
the student must produce), not just what the sentence is about.

### Valid topics:
{topic_list}

### Key distinctions:
- **adjective-agreement**: t-form (et-words), e-form (definite/plural/possessive), base form
- **comparative-superlative**: -ere/-est forms, "mere/mest", "bedre/bedst" etc.
- **noun-gender**: en/et gender, definite articles (-en/-et/-erne)
- **pronouns**: sin/sit/sine, personal pronouns, possessive pronouns
- **inverted-word-order**: V2 rule, inversion after adverbial/subordinate clause
- **main-subordinate-clauses**: da/når/om, fordi/hvis, clause connectors
- **verbs-tenses**: present/past/perfect, passive voice, imperative

### Output format:
Return a JSON array with ONLY the exercises that need reclassification:
```json
[
  {{"index": 42, "current_topic": "comparative-superlative", "recommended_topic": "adjective-agreement", "reasoning": "Tests t-form agreement, not comparison"}}
]
```
If all exercises are correctly classified, return `[]`.

---

### Exercises:

"""
    blocks = []
    for idx in indices:
        blocks.append(format_exercise(idx, exercises[idx]))

    return header + "\n\n".join(blocks) + "\n"


def cmd_generate(exercises: list[dict], topic_filter: str | None) -> None:
    """Generate prompt files for Claude Code review."""
    if topic_filter:
        indices = [
            i for i, ex in enumerate(exercises)
            if ex["grammar_topic_slug"] == topic_filter
        ]
        print(f"Filtering to {len(indices)} exercises with topic '{topic_filter}'")
    else:
        indices = list(range(len(exercises)))

    # Split into batches
    batches = []
    for i in range(0, len(indices), BATCH_SIZE):
        batches.append(indices[i:i + BATCH_SIZE])

    total = len(batches)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if total == 1:
        prompt = generate_prompt(exercises, batches[0], 1, 1)
        out_file = DATA_DIR / f"recategorize-prompt-{timestamp}.md"
        with open(out_file, "w") as f:
            f.write(prompt)
        print(f"Prompt saved: {out_file}")
        print(f"  {len(batches[0])} exercises")
    else:
        print(f"Generating {total} batch files ({BATCH_SIZE} exercises each)...")
        for i, batch in enumerate(batches):
            prompt = generate_prompt(exercises, batch, i + 1, total)
            out_file = DATA_DIR / f"recategorize-prompt-{timestamp}-batch{i + 1:02d}.md"
            with open(out_file, "w") as f:
                f.write(prompt)
            print(f"  Batch {i + 1}: {out_file.name} ({len(batch)} exercises)")

    # Show current topic distribution
    counts: Counter = Counter()
    for ex in exercises:
        counts[ex["grammar_topic_slug"]] += 1
    print("\nCurrent topic distribution:")
    for topic in VALID_TOPICS:
        print(f"  {topic}: {counts.get(topic, 0)}")

    print("\nNext steps:")
    print("  1. Open the prompt file(s) and paste into Claude Code")
    print("  2. Save Claude's JSON response to scripts/data/recategorize-changes.json")
    print("  3. Preview: uv run python recategorize-exercises.py --apply data/recategorize-changes.json")
    print("  4. Apply:   uv run python recategorize-exercises.py --apply data/recategorize-changes.json --write")


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------
def append_audit_log(changes: list[dict], source: str) -> None:
    """Append an entry to the persistent JSONL audit log."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    entry = {
        "timestamp": datetime.now().isoformat(),
        "source": source,
        "changes_applied": len(changes),
        "method": "claude-code-review",
        "changes": changes,
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"Audit log appended: {LOG_FILE.name} ({len(changes)} changes)")


# ---------------------------------------------------------------------------
# Apply changes
# ---------------------------------------------------------------------------
def cmd_apply(exercises: list[dict], changes_file: Path, write: bool) -> None:
    """Apply classification changes from a JSON file."""
    with open(changes_file) as f:
        changes = json.load(f)

    if not changes:
        print("No changes in the file.")
        return

    print(f"Loaded {len(changes)} changes from {changes_file.name}")

    # Validate
    errors = []
    for c in changes:
        idx = c.get("index")
        if idx is None:
            errors.append(f"Missing 'index' in: {c}")
            continue
        if idx < 0 or idx >= len(exercises):
            errors.append(f"Index {idx} out of range (0-{len(exercises) - 1})")
            continue
        rec = c.get("recommended_topic", "")
        if rec not in VALID_TOPICS:
            errors.append(f"[{idx}] Invalid topic '{rec}'")
            continue
        cur = c.get("current_topic", "")
        actual = exercises[idx]["grammar_topic_slug"]
        if cur and cur != actual:
            errors.append(
                f"[{idx}] current_topic mismatch: file says '{cur}', "
                f"actual is '{actual}'"
            )

    if errors:
        print(f"\nValidation errors ({len(errors)}):")
        for e in errors:
            print(f"  - {e}")
        print("\nFix these before applying.")
        return

    # Filter to actual changes (skip no-ops)
    real_changes = []
    for c in changes:
        idx = c["index"]
        rec = c["recommended_topic"]
        if exercises[idx]["grammar_topic_slug"] != rec:
            real_changes.append(c)

    if not real_changes:
        print("All recommended topics already match. No changes needed.")
        return

    # Show summary
    change_counts: Counter = Counter()
    for c in real_changes:
        key = f"{exercises[c['index']]['grammar_topic_slug']} → {c['recommended_topic']}"
        change_counts[key] += 1

    print(f"\nChanges to apply: {len(real_changes)}")
    print("\nBreakdown:")
    for key, count in change_counts.most_common():
        print(f"  {key}: {count}")

    # Show each change
    print("\nDetails:")
    for c in real_changes:
        idx = c["index"]
        ex = exercises[idx]
        old = ex["grammar_topic_slug"]
        new = c["recommended_topic"]
        reason = c.get("reasoning", "")
        print(f"  [{idx}] {old} → {new}")
        print(f"    Q: {ex['question'][:80]}")
        if reason:
            print(f"    Reason: {reason[:80]}")

    # Topic distribution before/after
    before: Counter = Counter()
    for ex in exercises:
        before[ex["grammar_topic_slug"]] += 1
    after = Counter(before)
    for c in real_changes:
        idx = c["index"]
        old = exercises[idx]["grammar_topic_slug"]
        after[old] -= 1
        after[c["recommended_topic"]] += 1

    print("\nTopic distribution (before → after):")
    for topic in VALID_TOPICS:
        b = before.get(topic, 0)
        a = after.get(topic, 0)
        delta = a - b
        marker = f" ({'+' if delta > 0 else ''}{delta})" if delta != 0 else ""
        print(f"  {topic}: {b} → {a}{marker}")

    if not write:
        print("\nDry-run complete. Add --write to apply.")
        return

    # Apply
    print(f"\nApplying {len(real_changes)} changes to {EXERCISES_FILE.name}...")
    for c in real_changes:
        exercises[c["index"]]["grammar_topic_slug"] = c["recommended_topic"]

    with open(EXERCISES_FILE, "w") as f:
        json.dump(exercises, f, indent=2, ensure_ascii=False)
    print(f"Updated {EXERCISES_FILE.name}")

    # Append to persistent audit log
    append_audit_log(real_changes, str(changes_file))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Recategorize exercises via Claude Code review"
    )
    parser.add_argument(
        "--topic",
        choices=VALID_TOPICS,
        help="Only include exercises currently assigned to this topic",
    )
    parser.add_argument(
        "--apply",
        type=Path,
        metavar="CHANGES.json",
        help="Apply changes from a JSON file (output from Claude review)",
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Actually modify exercises-pd3m2.json (default: dry-run)",
    )
    parser.add_argument(
        "--log",
        action="store_true",
        help="Show the audit log of all past recategorizations",
    )
    args = parser.parse_args()

    # Show log
    if args.log:
        if not LOG_FILE.exists():
            print("No audit log found yet.")
            return
        print(f"Audit log: {LOG_FILE}\n")
        with open(LOG_FILE) as f:
            for line in f:
                entry = json.loads(line)
                print(f"  {entry['timestamp']}  {entry['changes_applied']} changes  ({entry.get('method', '?')})")
                print(f"    Source: {entry.get('source', '?')}")
        return

    # Load exercises
    with open(EXERCISES_FILE) as f:
        exercises = json.load(f)
    print(f"Loaded {len(exercises)} exercises from {EXERCISES_FILE.name}")

    if args.apply:
        cmd_apply(exercises, args.apply, args.write)
    else:
        cmd_generate(exercises, args.topic)


if __name__ == "__main__":
    main()
