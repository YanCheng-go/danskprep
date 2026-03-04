#!/usr/bin/env python3
"""
Recategorize exercises by grammar_topic_slug using heuristic rules.

Many exercises were assigned the wrong topic during LLM generation — e.g.
adjective agreement exercises tagged as "comparative-superlative". This script
uses pattern-matching heuristics to detect and fix misclassifications without
requiring an API key.

Usage:
  cd scripts

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
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

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


# ---------------------------------------------------------------------------
# Heuristic classifier
# ---------------------------------------------------------------------------

# Comparative/superlative signal words in answer
COMPARATIVE_PATTERNS = re.compile(
    r"\b(mere|mest|bedre|bedst|værre|værst|mindre|mindst|"
    r"større|størst|ældre|ældst|yngre|yngst|flere|flest|"
    r"hurtigere|hurtigst|billigere|mørkere|anderledes|hellere)\b"
    r"|ere\b|est\b",
    re.IGNORECASE,
)

# Adjective agreement hint signals
AGREEMENT_HINT_PATTERNS = re.compile(
    r"(t-form|e-form|base.?form|adjective form|adjektiv|"
    r"et-noun|en-noun|definite|plural|possessive|"
    r"bestemt|flertal|base/-t/-e)",
    re.IGNORECASE,
)

# Subordinate clause conjunctions
SUBORDINATE_CONJUNCTIONS = re.compile(
    r"\b(fordi|hvis|når|da|selvom|mens|inden|skønt|"
    r"at\b.*\bhan|\bat\b.*\bhun|om\b.*\bhan|om\b.*\bhun)",
    re.IGNORECASE,
)

# Passive voice patterns
PASSIVE_PATTERNS = re.compile(
    r"(passiv|omskriv til (aktiv|passiv)|s-passive|blive.*participium|"
    r"\b\w+es\b.*→|\b\w+s\b.*passiv)",
    re.IGNORECASE,
)

# Pronoun patterns
PRONOUN_PATTERNS = re.compile(
    r"\b(sin|sit|sine|hans|hendes|deres|mig|dig|ham|hende|"
    r"os|jer|dem|min|mit|mine|din|dit|dine)\b",
    re.IGNORECASE,
)

# Word order / V2 patterns
V2_PATTERNS = re.compile(
    r"(ordstilling|word.?order|V2|inversion|omvendt)",
    re.IGNORECASE,
)


def classify_exercise(idx: int, ex: dict) -> dict | None:
    """Classify a single exercise. Returns a change dict or None if no change."""
    current = ex["grammar_topic_slug"]
    q = ex.get("question", "")
    a = ex.get("correct_answer", "")
    hint = ex.get("hint", "") or ""
    explanation = ex.get("explanation", "") or ""
    ex_type = ex.get("exercise_type", "")
    text = f"{q} {a} {hint} {explanation}"

    recommended = None
    reason = ""

    # ---- Rule 1: Adjective agreement detection ----
    # Hint says "adjective form", "t-form", "e-form", "base/-t/-e" etc.
    if AGREEMENT_HINT_PATTERNS.search(hint):
        # But NOT if the answer is a comparative/superlative form
        if not COMPARATIVE_PATTERNS.search(a):
            recommended = "adjective-agreement"
            reason = f"Hint indicates adjective agreement: '{hint[:60]}'"

    # ---- Rule 2: Conjugation exercises asking for t-form or e-form ----
    if ex_type == "conjugation" and recommended is None:
        q_lower = q.lower()
        if "t-formen" in q_lower or "t-form" in q_lower:
            if not COMPARATIVE_PATTERNS.search(a):
                recommended = "adjective-agreement"
                reason = f"Conjugation asks for t-form: answer '{a}'"
        elif "e-formen" in q_lower or "e-form" in q_lower:
            if not COMPARATIVE_PATTERNS.search(a):
                recommended = "adjective-agreement"
                reason = f"Conjugation asks for e-form: answer '{a}'"
        elif "komparativ" in q_lower:
            recommended = "comparative-superlative"
            reason = f"Conjugation asks for komparativ: answer '{a}'"
        elif "superlativ" in q_lower:
            recommended = "comparative-superlative"
            reason = f"Conjugation asks for superlativ: answer '{a}'"

    # ---- Rule 3: da/når/om conjunction exercises ----
    if recommended is None and current != "main-subordinate-clauses":
        a_lower = a.strip().lower().rstrip(".")
        if a_lower in ("da", "når", "om"):
            recommended = "main-subordinate-clauses"
            reason = f"Answer is conjunction '{a_lower}'"
        elif "da/når" in hint.lower() or "indirect" in hint.lower():
            recommended = "main-subordinate-clauses"
            reason = "Hint mentions da/når or indirect questions"
        # Error correction: når → da or vice versa
        if ex_type == "error_correction" and recommended is None:
            if re.search(r"\bNår\b.*→.*\bDa\b|\bda\b.*→.*\bnår\b", text):
                recommended = "main-subordinate-clauses"
                reason = "Error correction: da/når distinction"
            elif re.search(r"\bom\b.*indirekte|indirect.*\bom\b", text, re.I):
                recommended = "main-subordinate-clauses"
                reason = "Indirect question with 'om'"

    # ---- Rule 4: Passive voice / imperative exercises ----
    if recommended is None and current != "verbs-tenses":
        if PASSIVE_PATTERNS.search(text):
            recommended = "verbs-tenses"
            reason = "Tests passive voice or imperative conversion"
        elif "participium" in text.lower() or "perfektum" in hint.lower():
            recommended = "verbs-tenses"
            reason = "Tests past participle"

    # ---- Rule 5: Word order / V2 exercises ----
    if recommended is None and current != "inverted-word-order":
        if ex_type == "word_order" and "V2" in hint:
            recommended = "inverted-word-order"
            reason = "Word order exercise with V2 hint"
        elif V2_PATTERNS.search(hint):
            recommended = "inverted-word-order"
            reason = f"Hint indicates word order: '{hint[:60]}'"
        # Rewrite exercises that test V2 inversion
        if recommended is None and ex_type == "type_answer":
            if re.search(
                r"(omskriv.*begynder med|subordinate.*first.*→.*invert)",
                text, re.I,
            ):
                if "V2" in hint or "invert" in hint.lower() or "omvendt" in hint.lower():
                    recommended = "inverted-word-order"
                    reason = "Rewrite exercise testing V2 inversion"
        # Error correction with V2
        if recommended is None and ex_type == "error_correction":
            if re.search(r"V2|invert|omvendt", hint, re.I):
                recommended = "inverted-word-order"
                reason = "Error correction testing V2 word order"
            # subordinate clause first → V2 in main clause
            elif re.search(
                r"(Hvis|Når|Da|Selvom)\b.*,\s*(han|hun|jeg|vi|de|man)\s+\w+",
                a,
            ):
                if re.search(
                    r"(Hvis|Når|Da|Selvom)\b.*,\s+\w+\s+(han|hun|jeg|vi|de|man)",
                    q,
                ):
                    recommended = "inverted-word-order"
                    reason = "Error correction: V2 after subordinate clause"

    # ---- Rule 6: Pronoun exercises misclassified under noun-gender ----
    if recommended is None and current == "noun-gender":
        if a.strip().lower() in (
            "sin", "sit", "sine", "hans", "hendes", "deres",
            "mig", "dig", "ham", "hende", "os", "jer", "dem",
        ):
            recommended = "pronouns"
            reason = f"Answer is pronoun '{a}'"
        elif ex_type == "error_correction" and re.search(
            r"\b(sit|sin|sine)\b.*→.*\b(sine|sin|sit)\b", text,
        ):
            recommended = "pronouns"
            reason = "Error correction testing sin/sit/sine"

    # ---- Rule 7: Definite article exercises misclassified under pronouns ----
    if recommended is None and current == "pronouns":
        if ex_type == "error_correction" and re.search(
            r"[Ee]n (bil|hus|mand|kvinde)\w*\b.*→.*(bil|hus|mand|kvinde)\w+en\b",
            text,
        ):
            recommended = "noun-gender"
            reason = "Error correction about definite articles, not pronouns"
        # Simpler check: hint mentions article/definite but no pronouns
        if recommended is None and "article" in hint.lower() and not PRONOUN_PATTERNS.search(a):
            recommended = "noun-gender"
            reason = "Hint about articles, not pronouns"

    # ---- Rule 8: Adjective agreement from noun-gender ----
    if recommended is None and current == "noun-gender":
        # Exercises asking to fill in adjective forms
        if ex_type == "conjugation" and re.search(r"udfyld|adjektiv", q, re.I):
            if not COMPARATIVE_PATTERNS.search(a):
                recommended = "adjective-agreement"
                reason = "Fill-in-the-blank for adjective form"
        # Cloze where hint mentions possessive + adjective
        if recommended is None and "possessive" in hint.lower() and "adjective" in hint.lower():
            recommended = "adjective-agreement"
            reason = "Hint: adjective after possessive"
        # Hint explicitly says adjective/definite form
        if recommended is None and AGREEMENT_HINT_PATTERNS.search(hint):
            if not COMPARATIVE_PATTERNS.search(a):
                recommended = "adjective-agreement"
                reason = f"Hint indicates adjective agreement: '{hint[:60]}'"

    # ---- Only return if we recommend a different topic ----
    if recommended and recommended != current and recommended in VALID_TOPICS:
        return {
            "global_index": idx,
            "current_topic": current,
            "recommended_topic": recommended,
            "confidence": 0.9,
            "reasoning": reason,
        }

    return None


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------
def generate_markdown_report(
    changes: list[dict],
    exercises: list[dict],
    timestamp: str,
) -> str:
    """Generate a markdown report of the recategorization audit."""
    lines = [
        f"# Exercise Recategorization Report — {timestamp}",
        "",
        f"**Total exercises:** {len(exercises)}",
        f"**Changes recommended:** {len(changes)}",
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

    # All changes
    if changes:
        lines.append("## All Changes")
        lines.append("")
        for c in changes:
            global_idx = c["global_index"]
            ex = exercises[global_idx]
            lines.append(
                f"### [{global_idx}] {c['current_topic']} → {c['recommended_topic']}"
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
        description="Recategorize exercises by grammar_topic_slug using heuristics"
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
    args = parser.parse_args()

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

    # Classify each exercise
    changes: list[dict] = []
    for idx in indices:
        result = classify_exercise(idx, exercises[idx])
        if result:
            changes.append(result)

    # Summary
    print(f"\nChanges recommended: {len(changes)}")

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
        "total_analyzed": len(indices),
        "total_changes": len(changes),
        "topic_filter": args.topic,
        "changes": changes,
    }
    with open(audit_file, "w") as f:
        json.dump(audit_data, f, indent=2, ensure_ascii=False)
    print(f"\nAudit saved: {audit_file}")

    # Markdown report
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    report_file = DOCS_DIR / f"recategorization-report-{timestamp}.md"
    report = generate_markdown_report(changes, exercises, timestamp)
    with open(report_file, "w") as f:
        f.write(report)
    print(f"Report saved: {report_file}")

    # Apply changes
    if args.write and changes:
        print(f"\nApplying {len(changes)} changes to {EXERCISES_FILE.name}...")
        for c in changes:
            global_idx = c["global_index"]
            old_topic = exercises[global_idx]["grammar_topic_slug"]
            new_topic = c["recommended_topic"]
            exercises[global_idx]["grammar_topic_slug"] = new_topic
            print(f"  [{global_idx}] {old_topic} → {new_topic}")

        with open(EXERCISES_FILE, "w") as f:
            json.dump(exercises, f, indent=2, ensure_ascii=False)
        print(f"Updated {EXERCISES_FILE.name} with {len(changes)} changes")

        # Show final topic distribution
        final_counts: Counter = Counter()
        for ex in exercises:
            final_counts[ex["grammar_topic_slug"]] += 1
        print("\nFinal topic distribution:")
        for topic in VALID_TOPICS:
            print(f"  {topic}: {final_counts.get(topic, 0)}")
    elif args.write and not changes:
        print("\nNo changes to apply.")
    else:
        print("\nDry-run complete. Use --write to apply changes.")


if __name__ == "__main__":
    main()
