#!/usr/bin/env python3
"""
analyze-speakspeak.py

Reads raw scraped SpeakSpeak exercises and uses Claude to generate a rich set
of study/quiz exercises from them — far more than what the original scraper
captured (only first blank of multi-blank exercises).

What this does:
  - Extracts ALL cloze blanks from multi-blank exercises
  - Generates multiple exercise TYPES from each source item:
      cloze, type_answer, multiple_choice, word_order, error_correction
  - Writes PD3M2-quality exercises with hints and explanations
  - Deduplicates against existing exercises before writing

Usage:
  cd scripts
  export ANTHROPIC_API_KEY=sk-ant-...
  uv run python analyze-speakspeak.py               # dry-run, shows preview
  uv run python analyze-speakspeak.py --write       # write to exercises-pd3m2.json
  uv run python analyze-speakspeak.py --write --topic noun-gender   # one topic only
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import textwrap
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: Run: cd scripts && uv sync")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent.parent
SCRAPED_JSON  = PROJECT_ROOT / "src/data/seed/_speakspeak_raw_pd3m2_20260301_192523.json"
EXERCISES_JSON = PROJECT_ROOT / "src/data/seed/exercises-pd3m2.json"

VALID_TOPICS = [
    "noun-gender",
    "comparative-superlative",
    "inverted-word-order",
    "main-subordinate-clauses",
    "verbs-tenses",
    "pronouns",
]

VALID_TYPES = [
    "cloze",
    "type_answer",
    "multiple_choice",
    "word_order",
    "error_correction",
]

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = textwrap.dedent("""
    You are an expert Danish language teacher creating PD3 Module 2 exam practice exercises.
    Students are at B1 level aiming for B2. Target exam: Prøve i Dansk 3.

    YOUR TASK: Given raw scraped SpeakSpeak exercises, generate a rich set of clean,
    focused practice exercises with multiple exercise types. The original scraper only
    captured the first blank of multi-blank exercises — you should mine the full content.

    GRAMMAR TOPICS (use these exact slugs):
      noun-gender            — en/et, definite/indefinite/plural forms, noun agreement
      comparative-superlative — adjective degrees, word order with adverbs, da/når/hvis clauses
      inverted-word-order    — V2 rule, adverb + verb inversion in main clauses
      main-subordinate-clauses — subordinate clause structure, ikke-position, indirect questions
      verbs-tenses           — nutid/datid/førnutid/imperative, auxiliary selection (er/har)
      pronouns               — personal/possessive/reflexive (sig/ham/sin/hans), relative (som/der)

    EXERCISE TYPES you can generate (use these exact strings):
      cloze            — ONE sentence with exactly ONE blank (___). Must have a single unambiguous answer.
      type_answer      — Student types a translation OR writes the full correct form.
                         Question phrasing: "Oversæt til dansk: ..." or "Skriv sætningen om til datid:"
      multiple_choice  — Exactly 4 options in the "alternatives" array. Only one is correct.
      word_order       — Space-separated scrambled Danish words. Student reassembles into one sentence.
                         "question" must be the scrambled words (no numbers, no punctuation at end).
      error_correction — A Danish sentence with exactly ONE grammatical error. Student fixes it.

    QUALITY RULES:
      - Each exercise tests ONE specific grammar point
      - Cloze: the blank must have exactly one grammatically correct answer
      - Multiple choice: distractors must be the same part of speech, plausible, not obviously wrong
      - Word order: scrambled words must reassemble into exactly one correct sentence
      - Error correction: only ONE error per sentence, clearly grammatical (not spelling/punctuation)
      - Sentences should be natural, realistic, B1-B2 level Danish
      - Do NOT copy exercise questions verbatim from the source — rewrite/adapt them
      - Use vocabulary from the source material but keep sentences shorter and cleaner
      - acceptable_answers: list alternative correct spellings/forms; usually []

    OUTPUT: Return ONLY a valid JSON array. No markdown, no explanation, just the array.
    Each item must have ALL of these fields:
    {
      "grammar_topic_slug": "<one of the 6 slugs above>",
      "exercise_type": "<one of the 5 types above>",
      "question": "<the question text>",
      "correct_answer": "<exact correct answer>",
      "acceptable_answers": ["<alt1>", ...],
      "alternatives": null,   // for multiple_choice: ["opt1","opt2","opt3","opt4"] including correct
      "hint": "<helpful hint or null>",
      "explanation": "<grammar explanation in Danish or English, or null>",
      "module_level": 3,
      "difficulty": 1,   // 1=easy, 2=medium, 3=hard
      "source": "generated-from-speakspeak"
    }
""").strip()


def build_user_message(topic: str, source_exercises: list[dict]) -> str:
    lines = [
        f"TOPIC: {topic}",
        "",
        "SOURCE EXERCISES (raw scraped content — mine all the blanks and patterns):",
        "",
    ]
    for i, ex in enumerate(source_exercises):
        lines.append(f"--- Source {i+1} ---")
        lines.append(f"Type: {ex.get('exercise_type', 'cloze')}")
        lines.append(f"Question: {ex.get('question', '')}")
        lines.append(f"First captured answer: {ex.get('correct_answer', '')}")
        lines.append("")

    lines += [
        "INSTRUCTIONS:",
        f"1. Analyze ALL the source content above (topic: {topic})",
        "2. Extract every cloze blank, conjugation slot, and grammar pattern",
        "3. Generate 8-12 NEW exercises — do NOT just copy the source items",
        "4. Use a MIX of exercise types: aim for 3+ types from the list",
        "5. Cover both easy patterns (difficulty 1-2) and harder ones (difficulty 3)",
        "6. Each exercise must test something specific from the source content",
        "7. Return the JSON array of exercise objects",
    ]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Claude call
# ---------------------------------------------------------------------------

def generate_exercises(
    client: anthropic.Anthropic,
    topic: str,
    source_exercises: list[dict],
) -> list[dict]:
    print(f"  Calling Claude for topic '{topic}' ({len(source_exercises)} source exercises)...")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": build_user_message(topic, source_exercises)}],
    )

    raw = message.content[0].text.strip()

    start = raw.find("[")
    end = raw.rfind("]") + 1
    if start == -1 or end == 0:
        print(f"  WARNING: No JSON array in response for topic '{topic}'")
        print(f"  Response: {raw[:300]}")
        return []

    try:
        exercises = json.loads(raw[start:end])
        print(f"  Generated {len(exercises)} exercises")
        return exercises
    except json.JSONDecodeError as e:
        print(f"  WARNING: JSON parse error for topic '{topic}': {e}")
        return []


# ---------------------------------------------------------------------------
# Validation & normalisation
# ---------------------------------------------------------------------------

def validate_exercise(ex: dict) -> tuple[bool, str]:
    """Returns (is_valid, reason_if_invalid)."""
    if ex.get("grammar_topic_slug") not in VALID_TOPICS:
        return False, f"invalid topic: {ex.get('grammar_topic_slug')}"
    if ex.get("exercise_type") not in VALID_TYPES:
        return False, f"invalid type: {ex.get('exercise_type')}"
    if not ex.get("question", "").strip():
        return False, "empty question"
    if not ex.get("correct_answer", "").strip():
        return False, "empty correct_answer"
    if ex.get("exercise_type") == "multiple_choice":
        alts = ex.get("alternatives") or []
        if len(alts) != 4:
            return False, f"multiple_choice needs 4 alternatives, got {len(alts)}"
        if ex["correct_answer"] not in alts:
            return False, "correct_answer not in alternatives"
    if ex.get("exercise_type") == "cloze":
        if "_" not in ex.get("question", "") and "___" not in ex.get("question", ""):
            return False, "cloze question has no blank"
    return True, ""


def normalise_exercise(ex: dict) -> dict:
    """Ensure all required fields are present with correct types."""
    return {
        "grammar_topic_slug": ex.get("grammar_topic_slug"),
        "exercise_type": ex.get("exercise_type"),
        "question": ex.get("question", "").strip(),
        "correct_answer": ex.get("correct_answer", "").strip(),
        "acceptable_answers": ex.get("acceptable_answers") or [],
        "alternatives": ex.get("alternatives"),
        "hint": ex.get("hint") or None,
        "explanation": ex.get("explanation") or None,
        "module_level": int(ex.get("module_level", 3)),
        "difficulty": int(ex.get("difficulty", 2)),
        "source": "generated-from-speakspeak",
    }


def deduplicate(new_exercises: list[dict], existing_exercises: list[dict]) -> list[dict]:
    """Remove exercises with questions too similar to existing ones."""
    existing_questions = {
        ex["question"].strip().lower()[:80]
        for ex in existing_exercises
    }
    result = []
    seen_in_batch: set[str] = set()
    for ex in new_exercises:
        key = ex["question"].strip().lower()[:80]
        if key not in existing_questions and key not in seen_in_batch:
            result.append(ex)
            seen_in_batch.add(key)
    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Generate exercises from scraped SpeakSpeak content")
    parser.add_argument("--write", action="store_true", help="Write results to exercises-pd3m2.json (default: dry-run)")
    parser.add_argument("--topic", choices=VALID_TOPICS, help="Process only this topic")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation")
    args = parser.parse_args()

    import os
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY environment variable not set.")
        sys.exit(1)

    # Load scraped exercises
    with open(SCRAPED_JSON, encoding="utf-8") as f:
        scraped: list[dict] = json.load(f)
    print(f"Loaded {len(scraped)} scraped exercises")

    # Load existing exercises
    with open(EXERCISES_JSON, encoding="utf-8") as f:
        existing: list[dict] = json.load(f)
    print(f"Existing exercises: {len(existing)}")

    # Group scraped by topic
    by_topic: dict[str, list[dict]] = {}
    for ex in scraped:
        slug = ex.get("grammar_topic_slug") or "unknown"
        by_topic.setdefault(slug, []).append(ex)

    topics_to_process = [args.topic] if args.topic else [t for t in VALID_TOPICS if t in by_topic]
    print(f"\nTopics to process: {topics_to_process}")

    client = anthropic.Anthropic(api_key=api_key)

    all_new: list[dict] = []

    for topic in topics_to_process:
        sources = by_topic.get(topic, [])
        if not sources:
            print(f"  Skipping '{topic}' — no scraped source material")
            continue

        print(f"\n[{topic}] {len(sources)} source exercises")
        raw_generated = generate_exercises(client, topic, sources)

        valid = []
        invalid_count = 0
        for ex in raw_generated:
            ok, reason = validate_exercise(ex)
            if ok:
                valid.append(normalise_exercise(ex))
            else:
                invalid_count += 1
                print(f"  INVALID ({reason}): {str(ex)[:100]}")

        deduped = deduplicate(valid, existing + all_new)
        print(f"  Valid: {len(valid)}, After dedup: {len(deduped)}, Invalid: {invalid_count}")
        all_new.extend(deduped)

    print(f"\n{'='*50}")
    print(f"Total new exercises: {len(all_new)}")

    if not all_new:
        print("Nothing to add.")
        return

    # Preview
    print("\nPreview (first 15):")
    for ex in all_new[:15]:
        q_short = ex["question"][:70].replace("\n", " ")
        print(f"  [{ex['exercise_type']:18}] [{ex['grammar_topic_slug']:28}] diff={ex['difficulty']} | {q_short}")

    type_counts: dict[str, int] = {}
    for ex in all_new:
        t = ex["exercise_type"]
        type_counts[t] = type_counts.get(t, 0) + 1
    print(f"\nBy type: {type_counts}")

    if not args.write:
        print("\n(Dry-run mode — use --write to save to exercises-pd3m2.json)")
        return

    if not args.yes:
        answer = input(f"\nAdd {len(all_new)} exercises to exercises-pd3m2.json? [y/N] ").strip().lower()
        if answer != "y":
            print("Aborted.")
            return

    # Shuffle new exercises into the existing set for variety
    random.shuffle(all_new)
    merged = existing + all_new

    with open(EXERCISES_JSON, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"\nDone. exercises-pd3m2.json now has {len(merged)} exercises.")
    for t, count in sorted(type_counts.items()):
        print(f"  +{count} {t}")


if __name__ == "__main__":
    main()
