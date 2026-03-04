#!/usr/bin/env python3
"""
Recategorize exercises by grammar_topic_slug using LLM analysis.

Many exercises were assigned the wrong topic during generation — e.g. adjective
agreement exercises tagged as "comparative-superlative". This script audits every
exercise and corrects misclassifications.

Usage:
  cd scripts
  export ANTHROPIC_API_KEY=sk-ant-...

  # Dry-run: audit all exercises, produce report
  uv run python recategorize-exercises.py

  # Audit only one topic
  uv run python recategorize-exercises.py --topic comparative-superlative

  # Apply changes to seed file
  uv run python recategorize-exercises.py --write
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import textwrap
import time
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: Run: cd scripts && uv sync")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent.parent
SEED_DIR = PROJECT_ROOT / "src" / "data" / "seed"
EXERCISES_FILE = SEED_DIR / "exercises-pd3m2.json"
DATA_DIR = Path(__file__).parent / "data"
DOCS_DIR = PROJECT_ROOT / "docs" / "reviews"

VALID_TOPICS = [
    "noun-gender",
    "comparative-superlative",
    "inverted-word-order",
    "main-subordinate-clauses",
    "verbs-tenses",
    "pronouns",
    "adjective-agreement",
]

BATCH_SIZE = 20
RATE_LIMIT_DELAY = 0.3


# ---------------------------------------------------------------------------
# LLM helpers (reused from generate-from-dump.py)
# ---------------------------------------------------------------------------
def call_claude(
    client: anthropic.Anthropic,
    prompt: str,
    system: str,
    model: str = "claude-haiku-4-5-20251001",
    max_tokens: int = 4096,
) -> str:
    message = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip()


def parse_json_array(text: str) -> list[dict] | None:
    text = text.strip()
    if "```" in text:
        lines = text.split("\n")
        lines = [line for line in lines if not line.strip().startswith("```")]
        text = "\n".join(lines).strip()
    start = text.find("[")
    end = text.rfind("]") + 1
    if start == -1 or end == 0:
        return None
    try:
        data = json.loads(text[start:end])
        return data if isinstance(data, list) else None
    except json.JSONDecodeError:
        return None


# ---------------------------------------------------------------------------
# Classification prompt
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = textwrap.dedent("""\
    You are an expert Danish grammar classifier. Your job is to determine which
    grammar topic each exercise ACTUALLY tests, based on what the student must
    produce or identify (the blank, the answer, the error — not the surrounding
    sentence content).

    The 7 grammar topics and what they cover:

    1. noun-gender — Determining whether a noun is en-word or et-word. Definite/
       indefinite articles (en/et, -en/-et). Noun plurals (-er, -e, -ene, -erne).

    2. comparative-superlative — Comparative forms (-ere, mere), superlative forms
       (-est, mest). Comparing two or more things. Irregular comparisons (god →
       bedre → bedst). The tested element is a comparative or superlative FORM.

    3. adjective-agreement — Adjective inflection to match noun gender/number/
       definiteness. T-form for et-words (et stort hus), e-form for definite/
       plural/possessive (den store bil, store biler, min store bil). The tested
       element is the FORM of an adjective matching its noun context.
       KEY DISTINCTION from comparative-superlative: if the blank tests whether
       an adjective gets -t, -e, or base form to agree with its noun, it is
       adjective-agreement. If the blank tests -ere/-est/mere/mest or an
       irregular comparative form, it is comparative-superlative.

    4. inverted-word-order — V2 rule (verb must be second). Subject-verb inversion
       after fronted adverbs, time expressions, subordinate clauses. Ordering the
       subject and verb correctly when something other than the subject starts the
       sentence.

    5. main-subordinate-clauses — Adverb placement difference between main clauses
       (verb before adverb: "han spiser ikke") and subordinate clauses (adverb
       before verb: "fordi han ikke spiser"). Subordinating conjunctions (at,
       fordi, hvis, når, da, selvom, mens). Comma placement at clause boundaries.

    6. verbs-tenses — Verb conjugation: present (-er), past (-ede/-te), perfect
       (har + participle), future (vil/skal). Modal verbs (kan, skal, vil, må).
       Passive voice (-s / blive). Irregular verb forms. Imperative.

    7. pronouns — Subject/object pronoun forms (jeg/mig, han/ham). Possessive
       pronouns (min/mit/mine). Reflexive sin/sit/sine vs hans/hendes. Relative
       pronouns (som, der, hvis). Demonstrative, interrogative, indefinite
       pronouns.

    For each exercise, analyze:
    - What is blanked/tested/asked? (the specific grammar point)
    - Does the current topic match what is actually tested?

    Return a JSON array. For EACH exercise in the batch, return an object with:
    {
      "index": <integer, position in batch starting at 0>,
      "current_topic": "<the exercise's current grammar_topic_slug>",
      "recommended_topic": "<your recommended grammar_topic_slug>",
      "confidence": <float 0.0 to 1.0>,
      "reasoning": "<brief explanation of what grammar point is tested>"
    }

    Return ALL exercises in the batch, even if current_topic == recommended_topic.
    Use ONLY the 7 slugs listed above. Output ONLY the JSON array, no other text.
""")


def format_exercise_for_prompt(idx: int, ex: dict) -> str:
    """Format a single exercise for the LLM prompt."""
    parts = [f"[{idx}] topic={ex['grammar_topic_slug']}  type={ex['exercise_type']}"]
    parts.append(f"  Q: {ex['question']}")
    parts.append(f"  A: {ex['correct_answer']}")
    if ex.get("hint"):
        parts.append(f"  Hint: {ex['hint']}")
    if ex.get("explanation"):
        parts.append(f"  Explanation: {ex['explanation']}")
    if ex.get("alternatives"):
        parts.append(f"  Alternatives: {', '.join(ex['alternatives'])}")
    return "\n".join(parts)


def classify_batch(
    client: anthropic.Anthropic, exercises: list[dict], batch_start: int
) -> list[dict]:
    """Send a batch of exercises to the LLM for classification."""
    exercise_texts = []
    for i, ex in enumerate(exercises):
        exercise_texts.append(format_exercise_for_prompt(i, ex))

    prompt = (
        f"Classify these {len(exercises)} exercises (batch starting at global "
        f"index {batch_start}):\n\n" + "\n\n".join(exercise_texts)
    )

    response = call_claude(client, prompt, SYSTEM_PROMPT, max_tokens=4096)
    results = parse_json_array(response)

    if results is None:
        print(f"  WARNING: Failed to parse LLM response for batch at {batch_start}")
        return []

    # Validate results
    validated = []
    for item in results:
        if not isinstance(item, dict):
            continue
        rec = item.get("recommended_topic", "")
        if rec not in VALID_TOPICS:
            print(f"  WARNING: Invalid topic '{rec}' at index {item.get('index')}")
            continue
        validated.append(item)

    return validated


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------
def generate_markdown_report(
    changes: list[dict],
    all_results: list[dict],
    exercises: list[dict],
    timestamp: str,
) -> str:
    """Generate a markdown report of the recategorization audit."""
    lines = [
        f"# Exercise Recategorization Report — {timestamp}",
        "",
        f"**Total exercises analyzed:** {len(all_results)}",
        f"**Changes recommended:** {len(changes)}",
        f"**No change:** {len(all_results) - len(changes)}",
        "",
    ]

    # Migration matrix
    matrix: dict[str, Counter] = defaultdict(Counter)
    for c in changes:
        matrix[c["current_topic"]][c["recommended_topic"]] += 1

    if changes:
        lines.append("## Migration Matrix")
        lines.append("")
        lines.append("| From | To | Count |")
        lines.append("|------|----|-------|")
        for from_topic in sorted(matrix):
            for to_topic in sorted(matrix[from_topic]):
                lines.append(
                    f"| {from_topic} | {to_topic} | {matrix[from_topic][to_topic]} |"
                )
        lines.append("")

    # Topic distribution before/after
    before: Counter = Counter()
    after: Counter = Counter()
    for ex in exercises:
        before[ex["grammar_topic_slug"]] += 1
    after = Counter(before)
    for c in changes:
        after[c["current_topic"]] -= 1
        after[c["recommended_topic"]] += 1

    lines.append("## Topic Distribution")
    lines.append("")
    lines.append("| Topic | Before | After | Delta |")
    lines.append("|-------|--------|-------|-------|")
    for topic in VALID_TOPICS:
        b = before.get(topic, 0)
        a = after.get(topic, 0)
        delta = a - b
        sign = "+" if delta > 0 else ""
        lines.append(f"| {topic} | {b} | {a} | {sign}{delta} |")
    lines.append("")

    # Low-confidence flags
    low_conf = [c for c in changes if c.get("confidence", 1.0) < 0.8]
    if low_conf:
        lines.append("## Low Confidence Changes (< 0.8)")
        lines.append("")
        for c in low_conf:
            global_idx = c["global_index"]
            ex = exercises[global_idx]
            lines.append(
                f"- **[{global_idx}]** {c['current_topic']} → {c['recommended_topic']} "
                f"(conf: {c.get('confidence', '?')})"
            )
            lines.append(f"  - Q: {ex['question']}")
            lines.append(f"  - A: {ex['correct_answer']}")
            lines.append(f"  - Reason: {c.get('reasoning', 'N/A')}")
        lines.append("")

    # All changes
    if changes:
        lines.append("## All Changes")
        lines.append("")
        for c in changes:
            global_idx = c["global_index"]
            ex = exercises[global_idx]
            lines.append(
                f"### [{global_idx}] {c['current_topic']} → {c['recommended_topic']} "
                f"(conf: {c.get('confidence', '?')})"
            )
            lines.append(f"- **Q:** {ex['question']}")
            lines.append(f"- **A:** {ex['correct_answer']}")
            lines.append(f"- **Reason:** {c.get('reasoning', 'N/A')}")
            lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Recategorize exercises by grammar_topic_slug using LLM"
    )
    parser.add_argument(
        "--topic",
        choices=VALID_TOPICS,
        help="Only audit exercises currently assigned to this topic",
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Apply changes to exercises-pd3m2.json (default: dry-run)",
    )
    parser.add_argument(
        "--confidence-threshold",
        type=float,
        default=0.7,
        help="Only apply changes above this confidence (default: 0.7)",
    )
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: Set ANTHROPIC_API_KEY environment variable")
        sys.exit(1)

    # Load exercises
    with open(EXERCISES_FILE) as f:
        exercises = json.load(f)
    print(f"Loaded {len(exercises)} exercises from {EXERCISES_FILE.name}")

    # Filter by topic if specified
    if args.topic:
        indices = [
            i for i, ex in enumerate(exercises)
            if ex["grammar_topic_slug"] == args.topic
        ]
        print(f"Filtering to {len(indices)} exercises with topic '{args.topic}'")
    else:
        indices = list(range(len(exercises)))

    # Process in batches
    client = anthropic.Anthropic(api_key=api_key)
    all_results: list[dict] = []
    changes: list[dict] = []
    total_batches = (len(indices) + BATCH_SIZE - 1) // BATCH_SIZE

    print(f"Processing {len(indices)} exercises in {total_batches} batches...")

    for batch_num in range(total_batches):
        batch_start = batch_num * BATCH_SIZE
        batch_indices = indices[batch_start : batch_start + BATCH_SIZE]
        batch_exercises = [exercises[i] for i in batch_indices]

        print(
            f"  Batch {batch_num + 1}/{total_batches} "
            f"(exercises {batch_indices[0]}-{batch_indices[-1]})...",
            end="",
            flush=True,
        )

        results = classify_batch(client, batch_exercises, batch_indices[0])

        batch_changes = 0
        for item in results:
            local_idx = item.get("index", -1)
            if local_idx < 0 or local_idx >= len(batch_indices):
                continue

            global_idx = batch_indices[local_idx]
            item["global_index"] = global_idx
            all_results.append(item)

            if item["current_topic"] != item["recommended_topic"]:
                item["global_index"] = global_idx
                changes.append(item)
                batch_changes += 1

        print(f" {len(results)} classified, {batch_changes} changes")

        if batch_num < total_batches - 1:
            time.sleep(RATE_LIMIT_DELAY)

    # Summary
    print("\n--- Summary ---")
    print(f"Total analyzed: {len(all_results)}")
    print(f"Changes recommended: {len(changes)}")

    above_threshold = [
        c for c in changes if c.get("confidence", 0) >= args.confidence_threshold
    ]
    below_threshold = [
        c for c in changes if c.get("confidence", 0) < args.confidence_threshold
    ]
    print(
        f"Above confidence threshold ({args.confidence_threshold}): "
        f"{len(above_threshold)}"
    )
    print(f"Below threshold (flagged for review): {len(below_threshold)}")

    # Topic change counts
    change_counts: Counter = Counter()
    for c in changes:
        key = f"{c['current_topic']} → {c['recommended_topic']}"
        change_counts[key] += 1
    if change_counts:
        print("\nChange breakdown:")
        for key, count in change_counts.most_common():
            print(f"  {key}: {count}")

    # Save outputs
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    audit_file = DATA_DIR / f"recategorization-audit-{timestamp}.json"
    audit_data = {
        "timestamp": timestamp,
        "total_exercises": len(exercises),
        "total_analyzed": len(all_results),
        "total_changes": len(changes),
        "confidence_threshold": args.confidence_threshold,
        "topic_filter": args.topic,
        "changes": changes,
        "all_results": all_results,
    }
    with open(audit_file, "w") as f:
        json.dump(audit_data, f, indent=2, ensure_ascii=False)
    print(f"\nAudit saved: {audit_file}")

    # Markdown report
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    report_file = DOCS_DIR / f"recategorization-report-{timestamp}.md"
    report = generate_markdown_report(changes, all_results, exercises, timestamp)
    with open(report_file, "w") as f:
        f.write(report)
    print(f"Report saved: {report_file}")

    # Apply changes
    if args.write and above_threshold:
        print(f"\nApplying {len(above_threshold)} changes to {EXERCISES_FILE.name}...")
        for c in above_threshold:
            global_idx = c["global_index"]
            old_topic = exercises[global_idx]["grammar_topic_slug"]
            new_topic = c["recommended_topic"]
            exercises[global_idx]["grammar_topic_slug"] = new_topic
            print(f"  [{global_idx}] {old_topic} → {new_topic}")

        with open(EXERCISES_FILE, "w") as f:
            json.dump(exercises, f, indent=2, ensure_ascii=False)
        print(f"Updated {EXERCISES_FILE.name} with {len(above_threshold)} changes")

        # Show final topic distribution
        final_counts: Counter = Counter()
        for ex in exercises:
            final_counts[ex["grammar_topic_slug"]] += 1
        print("\nFinal topic distribution:")
        for topic in VALID_TOPICS:
            print(f"  {topic}: {final_counts.get(topic, 0)}")
    elif args.write and not above_threshold:
        print("\nNo changes above confidence threshold to apply.")
    else:
        print("\nDry-run complete. Use --write to apply changes.")


if __name__ == "__main__":
    main()
