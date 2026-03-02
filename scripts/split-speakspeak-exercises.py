"""
split-speakspeak-exercises.py
─────────────────────────────
Reads the 35 original scraped SpeakSpeak exercises (lines 1–409 of
exercises-pd3m2.json), sends each one to Claude, and asks it to split
the multi-blank exercise into clean individual questions.

Output: scripts/data/exercises-pd3m2-split.json  (review before merging)

Usage:
  cd scripts
  export ANTHROPIC_API_KEY=sk-ant-...
  uv run python split-speakspeak-exercises.py [--dry-run] [--start N] [--limit N]

Flags:
  --dry-run   Print prompts and mock responses, don't call the API.
  --start N   Skip the first N scraped exercises (0-indexed). Useful for resuming.
  --limit N   Only process N exercises total.
  --output F  Override output file path.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

import anthropic

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
EXERCISES_FILE = ROOT / "src/data/seed/exercises-pd3m2.json"
DEFAULT_OUTPUT = ROOT / "scripts/data/exercises-pd3m2-split.json"

# ── Constants ─────────────────────────────────────────────────────────────────
SCRAPED_SOURCE = "speakspeak"
# The first 35 exercises in the file are the raw scraped ones (source="speakspeak",
# with multi-blank questions and only the first blank's answer).
MAX_SCRAPED = 35

VALID_TOPICS = {
    "noun-gender",
    "pronouns",
    "comparative-superlative",
    "inverted-word-order",
    "main-subordinate-clauses",
    "verbs-tenses",
}
VALID_TYPES = {
    "cloze",
    "multiple_choice",
    "type_answer",
    "word_order",
    "error_correction",
    "conjugation",
}

# ── System prompt ──────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """\
You are a Danish language exam exercise generator specialising in PD3 Module 2 content.

Your task: given a single multi-blank SpeakSpeak exercise, return a JSON array of
individual, self-contained exercises — one per meaningful blank (or one per
sentence if it is a sentence-transformation exercise).

GRAMMAR TOPIC SLUGS (use exactly these):
  noun-gender              – en/et words, definite vs. indefinite, plural forms
  pronouns                 – personal, possessive (sin/sit/sine vs hans/hendes),
                             reflexive, relative (som vs der)
  comparative-superlative  – adjective inflection, komparativ/superlativ
  inverted-word-order      – V2 rule, adverb placement in helsætning
  main-subordinate-clauses – ledsætning word order, adverb placement before verb,
                             da/når/hvis/fordi/selvom clauses, indirect questions
  verbs-tenses             – conjugation, nutid/datid/perfektum, passive, modal verbs

EXERCISE TYPE RULES:
  cloze          – sentence with one ___ blank; correct_answer is the single missing word/phrase
  multiple_choice – 4 options; correct_answer + exactly 3 alternatives (wrong choices)
  type_answer    – open production task (e.g., "Rewrite in past tense:", "Give bestemt form of X")
  word_order     – scrambled word tokens; correct_answer is the full correct sentence
  conjugation    – like type_answer but specifically for verb forms

OUTPUT FORMAT (return ONLY a JSON array, no markdown, no text outside JSON):
[
  {
    "grammar_topic_slug": "<slug>",
    "exercise_type": "<type>",
    "question": "<question text with ___ for blank>",
    "correct_answer": "<answer>",
    "acceptable_answers": ["<alt spelling>"],   // optional, omit if not needed
    "alternatives": ["<wrong1>","<wrong2>","<wrong3>"],  // required for multiple_choice, null otherwise
    "hint": "<optional short hint>",            // omit or null if not helpful
    "explanation": "<why this is correct>",
    "module_level": 3,
    "difficulty": <1|2|3>,
    "source": "speakspeak"
  }
]

QUALITY RULES:
1. Skip any blank where the correct answer is genuinely ambiguous or requires
   full-paragraph context that cannot fit in a self-contained question.
2. For multiple_choice: distractors must be the same grammatical category and
   plausible enough to require real knowledge to reject.
3. For relative pronouns (som/der): if BOTH are correct for subject position,
   set correct_answer to "der" and add acceptable_answers: ["der","som"].
4. For possessives (sin/sit/sine vs hans/hendes/deres): make sure the sentence
   is self-contained enough to determine the subject.
5. Correctly re-label the grammar_topic_slug if the original was wrong.
   (SpeakSpeak labels are often mis-matched to content.)
6. Difficulty: 1=straightforward, 2=requires grammar knowledge, 3=complex/nuanced.
7. Keep questions in the language of the source (Danish sentences stay in Danish).
8. For sentence-transformation exercises (e.g., "Skriv i datid:"), use type_answer
   and write the question as a clear instruction followed by the source sentence.
"""

USER_TEMPLATE = """\
Original exercise #{idx} (grammar_topic as labelled by SpeakSpeak: {original_topic})
Source title: {source_title}

Multi-blank question:
{question}

First blank answer provided by SpeakSpeak: {first_answer}

Please split this into individual exercises. \
Remember: return ONLY a valid JSON array.
"""


# ── Helpers ────────────────────────────────────────────────────────────────────

def load_scraped_exercises(limit: int | None = None) -> list[dict]:
    """Return the first MAX_SCRAPED exercises that were scraped from SpeakSpeak."""
    all_ex = json.loads(EXERCISES_FILE.read_text(encoding="utf-8"))
    scraped = [e for e in all_ex if e.get("source") == SCRAPED_SOURCE
               and e.get("difficulty") == 3
               and e.get("alternatives") is None][:MAX_SCRAPED]
    if limit:
        scraped = scraped[:limit]
    return scraped


def load_existing_questions() -> set[str]:
    """Return the set of existing question strings for deduplication."""
    all_ex = json.loads(EXERCISES_FILE.read_text(encoding="utf-8"))
    return {e["question"].strip().lower() for e in all_ex}


def parse_response(text: str) -> list[dict]:
    """Extract and parse the JSON array from Claude's response."""
    text = text.strip()
    # Strip markdown fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(
            line for line in lines
            if not line.strip().startswith("```")
        ).strip()
    # Find the outermost [ ... ]
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        raise ValueError(f"No JSON array found in response:\n{text[:500]}")
    return json.loads(text[start : end + 1])


def validate_exercise(ex: dict) -> list[str]:
    """Return a list of validation errors (empty list = valid)."""
    errors = []
    if ex.get("grammar_topic_slug") not in VALID_TOPICS:
        errors.append(f"Unknown topic: {ex.get('grammar_topic_slug')}")
    if ex.get("exercise_type") not in VALID_TYPES:
        errors.append(f"Unknown type: {ex.get('exercise_type')}")
    if not ex.get("question"):
        errors.append("Empty question")
    if not ex.get("correct_answer"):
        errors.append("Empty correct_answer")
    if ex.get("exercise_type") == "multiple_choice":
        alts = ex.get("alternatives") or []
        if len(alts) != 3:
            errors.append(f"multiple_choice needs 3 alternatives, got {len(alts)}")
    return errors


def fix_exercise(ex: dict) -> dict:
    """Apply automatic fixes to common issues."""
    # Ensure required fields exist
    ex.setdefault("alternatives", None)
    ex.setdefault("acceptable_answers", None)
    ex.setdefault("hint", None)
    ex.setdefault("explanation", "")
    ex.setdefault("module_level", 3)
    ex.setdefault("difficulty", 2)
    ex["source"] = "speakspeak"
    # Remove empty acceptable_answers list
    if ex.get("acceptable_answers") == []:
        ex["acceptable_answers"] = None
    return ex


def deduplicate(new_exercises: list[dict], existing_questions: set[str]) -> tuple[list[dict], int]:
    """Return (kept, skipped_count)."""
    seen = set(existing_questions)
    kept, skipped = [], 0
    for ex in new_exercises:
        key = ex["question"].strip().lower()
        if key in seen:
            skipped += 1
        else:
            kept.append(ex)
            seen.add(key)
    return kept, skipped


# ── Main processing ────────────────────────────────────────────────────────────

def process_exercise(
    client: anthropic.Anthropic,
    idx: int,
    ex: dict,
    dry_run: bool = False,
) -> list[dict]:
    """Call Claude to split one multi-blank exercise into individual exercises."""

    source_title = ""
    expl = ex.get("explanation") or ""
    if "SpeakSpeak:" in expl:
        source_title = expl.split("SpeakSpeak:")[-1].strip()

    user_msg = USER_TEMPLATE.format(
        idx=idx + 1,
        original_topic=ex.get("grammar_topic_slug", "unknown"),
        source_title=source_title,
        question=ex["question"],
        first_answer=ex.get("correct_answer", "unknown"),
    )

    print(f"\n{'─'*70}")
    print(f"[{idx+1}/{MAX_SCRAPED}] {source_title or '(no title)'}")
    print(f"  Original topic: {ex.get('grammar_topic_slug')}")
    print(f"  Question length: {len(ex['question'])} chars")

    if dry_run:
        print("  [DRY RUN] Skipping API call.")
        return []

    # Call Claude
    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = response.content[0].text
    except Exception as e:
        print(f"  ERROR calling API: {e}", file=sys.stderr)
        return []

    # Parse
    try:
        exercises = parse_response(raw)
    except (ValueError, json.JSONDecodeError) as e:
        print(f"  ERROR parsing response: {e}", file=sys.stderr)
        print(f"  Raw response (first 500 chars):\n{raw[:500]}", file=sys.stderr)
        return []

    # Validate and fix
    valid, invalid = [], []
    for ex_new in exercises:
        ex_new = fix_exercise(ex_new)
        errs = validate_exercise(ex_new)
        if errs:
            invalid.append((ex_new, errs))
        else:
            valid.append(ex_new)

    print(f"  → {len(valid)} valid exercises extracted", end="")
    if invalid:
        print(f"  ({len(invalid)} invalid, see below)", end="")
        for bad, errs in invalid:
            print(f"\n    INVALID: {bad.get('question','?')[:60]} — {errs}")
    print()

    return valid


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Don't call the API")
    parser.add_argument("--start", type=int, default=0, help="Start index (0-based)")
    parser.add_argument("--limit", type=int, default=None, help="Max exercises to process")
    parser.add_argument("--output", type=str, default=str(DEFAULT_OUTPUT), help="Output file")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key and not args.dry_run:
        print("ERROR: ANTHROPIC_API_KEY not set. Use --dry-run to test without API.", file=sys.stderr)
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key or "dummy") if not args.dry_run else None

    # Load data
    scraped = load_scraped_exercises()
    print(f"Found {len(scraped)} scraped exercises to process.")

    if args.start:
        scraped = scraped[args.start:]
        print(f"Starting from index {args.start}.")
    if args.limit:
        scraped = scraped[:args.limit]
        print(f"Limited to {args.limit} exercises.")

    existing_questions = load_existing_questions()
    print(f"Loaded {len(existing_questions)} existing questions for deduplication.")

    output_path = Path(args.output)
    # Load any previously saved results to allow resuming
    all_new: list[dict] = []
    if output_path.exists():
        all_new = json.loads(output_path.read_text(encoding="utf-8"))
        print(f"Resuming: {len(all_new)} exercises already in {output_path.name}")

    # Process
    for idx, ex in enumerate(scraped, start=args.start):
        exercises = process_exercise(
            client=client,  # type: ignore[arg-type]
            idx=idx,
            ex=ex,
            dry_run=args.dry_run,
        )
        all_new.extend(exercises)

        # Save after each exercise (allows interruption and resumption)
        if not args.dry_run:
            output_path.write_text(
                json.dumps(all_new, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

        # Rate-limit: ~2 req/s is safe for Haiku
        if not args.dry_run:
            time.sleep(0.5)

    # Final deduplication
    kept, skipped = deduplicate(all_new, existing_questions)
    print(f"\n{'═'*70}")
    print(f"Total raw exercises generated: {len(all_new)}")
    print(f"Deduplicated (against existing): {skipped} skipped")
    print(f"Ready to merge: {len(kept)}")

    # Summary by topic
    from collections import Counter
    by_topic = Counter(e["grammar_topic_slug"] for e in kept)
    by_type = Counter(e["exercise_type"] for e in kept)
    print("\nBy topic:")
    for k, v in sorted(by_topic.items()):
        print(f"  {k}: {v}")
    print("By type:")
    for k, v in sorted(by_type.items()):
        print(f"  {k}: {v}")

    # Save deduplicated results
    output_path.write_text(
        json.dumps(kept, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\nSaved to: {output_path}")
    print(
        "\nNext step: review the output file, then run:\n"
        "  python merge-split-exercises.py\n"
        "to merge into exercises-pd3m2.json"
    )


if __name__ == "__main__":
    main()
