#!/usr/bin/env python3
"""
Generate clean seed exercises from the full SpeakSpeak dump.

Groups extracted exercises by source URL (one H5P activity = one LLM call),
sends the full context (title + all blanks/answers) to Claude, and gets back
clean standalone exercises in seed format.

Also enriches vocabulary candidates with english translations, POS, and inflections.

Usage:
  cd scripts
  export ANTHROPIC_API_KEY=sk-ant-...

  # Step 3: Generate exercises (dry-run)
  uv run python generate-from-dump.py exercises

  # Step 3: Generate exercises (write to seed)
  uv run python generate-from-dump.py exercises --write

  # Step 4: Enrich vocabulary
  uv run python generate-from-dump.py vocab

  # Step 4: Enrich vocabulary (write to seed)
  uv run python generate-from-dump.py vocab --write

  # Step 5: Verify exercises
  uv run python generate-from-dump.py verify

  # All steps
  uv run python generate-from-dump.py all --write
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import textwrap
import time
from collections import Counter
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: Run: cd scripts && uv sync")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent.parent
SEED_DIR = PROJECT_ROOT / "src" / "data" / "seed"
EXERCISES_FILE = SEED_DIR / "exercises-pd3m2.json"
WORDS_FILE = SEED_DIR / "words-pd3m2.json"
WRITING_FILE = SEED_DIR / "writing-prompts-pd3m2.json"
DATA_DIR = Path(__file__).parent / "data"

# Find latest dump files
def _latest(pattern: str) -> Path | None:
    files = sorted(DATA_DIR.glob(pattern), reverse=True)
    return files[0] if files else None

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
    "conjugation",
]


# ---------------------------------------------------------------------------
# LLM helpers
# ---------------------------------------------------------------------------
def call_claude(client: anthropic.Anthropic, prompt: str, system: str,
                model: str = "claude-haiku-4-5-20251001", max_tokens: int = 4096) -> str:
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
        lines = [l for l in lines if not l.strip().startswith("```")]
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
# Step 3: Generate exercises grouped by source URL
# ---------------------------------------------------------------------------
EXERCISE_SYSTEM = textwrap.dedent("""
    You are an expert Danish language teacher creating PD3 Module 2 exam exercises.
    Students are at B1 level aiming for B2. Target exam: Prøve i Dansk 3.

    YOUR TASK: Given an H5P exercise from SpeakSpeak with its title, all blanks,
    and all correct answers, generate clean standalone exercises in seed format.

    GRAMMAR TOPICS (use these exact slugs):
      noun-gender              — en/et, definite/indefinite/plural, noun agreement
      comparative-superlative  — adjective degrees, adverb forms
      inverted-word-order      — V2 rule, adverb+verb inversion in main clauses
      main-subordinate-clauses — subordinate clause structure, ikke-position, da/når/hvis/fordi
      verbs-tenses             — nutid/datid/førnutid/førdatid/imperative, er/har auxiliary
      pronouns                 — personal/possessive/reflexive (sin/hans), relative (som/der)

    EXERCISE TYPES:
      cloze            — ONE sentence, ONE blank (___), one unambiguous answer
      type_answer      — "Oversæt:" or "Skriv om til datid:" style
      multiple_choice  — question + correct_answer + exactly 3 wrong alternatives
      word_order       — scrambled words, student reassembles
      error_correction — sentence with ONE error, student fixes
      conjugation      — verb form question

    RULES:
    1. Each exercise tests ONE grammar point — short, focused, standalone
    2. DO NOT just copy the original multi-blank sentence — rewrite into clean individual exercises
    3. Use vocabulary from the source but make sentences natural and B1-B2 level
    4. Generate a MIX of types (aim for 3+ different types)
    5. For cloze: exactly one ___ per question
    6. For multiple_choice: exactly 3 plausible wrong alternatives
    7. All hints and explanations in English
    8. Generate 1-2 exercises per source blank/question (more for rich content, fewer for repetitive)

    OUTPUT: Return ONLY a valid JSON array. Each object:
    {
      "grammar_topic_slug": "<slug>",
      "exercise_type": "<type>",
      "question": "<question>",
      "correct_answer": "<answer>",
      "acceptable_answers": [],
      "alternatives": null,
      "hint": "<hint or null>",
      "explanation": "<why correct>",
      "module_level": 3,
      "difficulty": 1|2|3,
      "source": "speakspeak-dump"
    }
""").strip()


def build_exercise_prompt(source_name: str, source_url: str,
                          exercises: list[dict]) -> str:
    lines = [
        f"H5P ACTIVITY: {source_name}",
        f"URL: {source_url}",
        f"Total blanks/questions: {len(exercises)}",
        "",
        "ALL BLANKS AND ANSWERS:",
        "",
    ]

    for i, ex in enumerate(exercises):
        lines.append(f"  {i+1}. [{ex.get('exercise_type', 'cloze')}]")
        lines.append(f"     Q: {ex['question'][:300]}")
        lines.append(f"     A: {ex['correct_answer']}")
        if ex.get('hint'):
            lines.append(f"     Hint: {ex['hint']}")
        if ex.get('alternatives'):
            lines.append(f"     Alts: {ex['alternatives']}")
        lines.append("")

    lines.append("Generate clean standalone exercises from this content.")
    return "\n".join(lines)


def validate_exercise(ex: dict) -> bool:
    if ex.get("grammar_topic_slug") not in VALID_TOPICS:
        return False
    if ex.get("exercise_type") not in VALID_TYPES:
        return False
    if not ex.get("question", "").strip():
        return False
    if not ex.get("correct_answer", "").strip():
        return False
    if ex.get("exercise_type") == "multiple_choice":
        alts = ex.get("alternatives") or []
        if len(alts) < 2:
            return False
    if ex.get("exercise_type") == "cloze":
        if "___" not in ex.get("question", "") and "_" not in ex.get("question", ""):
            return False
    return True


def normalize_exercise(ex: dict) -> dict:
    return {
        "grammar_topic_slug": ex["grammar_topic_slug"],
        "exercise_type": ex["exercise_type"],
        "question": ex["question"].strip(),
        "correct_answer": ex["correct_answer"].strip(),
        "acceptable_answers": ex.get("acceptable_answers") or [],
        "alternatives": ex.get("alternatives"),
        "hint": ex.get("hint") or None,
        "explanation": ex.get("explanation") or None,
        "module_level": int(ex.get("module_level", 3)),
        "difficulty": int(ex.get("difficulty", 2)),
        "source": "speakspeak-dump",
    }


def deduplicate(new: list[dict], existing: list[dict]) -> list[dict]:
    existing_keys = {e["question"].strip().lower()[:80] for e in existing}
    kept: list[dict] = []
    seen: set[str] = set()
    for ex in new:
        key = ex["question"].strip().lower()[:80]
        if key not in existing_keys and key not in seen:
            kept.append(ex)
            seen.add(key)
    return kept


def run_exercises(client: anthropic.Anthropic, write: bool, limit: int | None) -> None:
    dump_path = _latest("dump-exercises-*.json")
    if not dump_path:
        print("ERROR: No dump-exercises-*.json found in scripts/data/")
        return

    print(f"Loading: {dump_path.name}")
    dump_exercises = json.loads(dump_path.read_text(encoding="utf-8"))
    print(f"  {len(dump_exercises)} extracted exercises")

    # Group by source URL
    by_url: dict[str, dict] = {}
    for ex in dump_exercises:
        url = ex.get("source_url", "")
        if not url:
            continue
        if url not in by_url:
            by_url[url] = {
                "name": ex.get("source_name", ""),
                "url": url,
                "exercises": [],
            }
        by_url[url]["exercises"].append(ex)

    groups = list(by_url.values())
    if limit:
        groups = groups[:limit]
    print(f"  {len(groups)} source URLs to process")

    # Load existing for dedup
    existing = json.loads(EXERCISES_FILE.read_text(encoding="utf-8")) if EXERCISES_FILE.exists() else []
    print(f"  Existing exercises: {len(existing)}")

    all_new: list[dict] = []

    for i, group in enumerate(groups):
        name = group["name"][:55]
        n_items = len(group["exercises"])
        print(f"\n  [{i+1}/{len(groups)}] {name} ({n_items} items)...", end=" ", flush=True)

        prompt = build_exercise_prompt(group["name"], group["url"], group["exercises"])

        try:
            response = call_claude(client, prompt, EXERCISE_SYSTEM, max_tokens=8192)
            parsed = parse_json_array(response)
        except Exception as e:
            print(f"ERROR: {e}")
            continue

        if not parsed:
            print("PARSE ERROR")
            continue

        valid = []
        for ex in parsed:
            if validate_exercise(ex):
                valid.append(normalize_exercise(ex))

        deduped = deduplicate(valid, existing + all_new)
        all_new.extend(deduped)
        print(f"OK (+{len(deduped)} exercises, {len(parsed) - len(valid)} invalid)")

        # Rate limiting
        time.sleep(0.3)

    print(f"\n{'='*50}")
    print(f"Total new exercises: {len(all_new)}")

    if all_new:
        types = Counter(e["exercise_type"] for e in all_new)
        topics = Counter(e["grammar_topic_slug"] for e in all_new)
        print(f"  By type: {dict(types)}")
        print(f"  By topic: {dict(topics)}")

        # Save intermediate output
        out_path = DATA_DIR / "generated-exercises.json"
        out_path.write_text(json.dumps(all_new, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"  Saved: {out_path}")

        if write:
            merged = existing + all_new
            EXERCISES_FILE.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"  MERGED into {EXERCISES_FILE} ({len(merged)} total)")


# ---------------------------------------------------------------------------
# Step 4: Enrich vocabulary
# ---------------------------------------------------------------------------
VOCAB_SYSTEM = textwrap.dedent("""
    You are a Danish linguistics expert building a vocabulary database for PD3 Module 2.

    For each Danish word, provide:
    {
      "danish": "base/infinitive form (no 'at' for verbs)",
      "english": "English translation",
      "part_of_speech": "verb" | "adjective" | "noun",
      "gender": null for verbs/adj, "en" or "et" for nouns,
      "tags": ["semantic_tag"],
      "difficulty": 1|2|3,
      "inflections": {
        // verbs: "present", "past", "perfect", "imperative"
        // adjectives: "t_form", "e_form", "comparative", "superlative"
        // nouns: "definite", "plural_indef", "plural_def"
      },
      "example_da": "Danish example sentence",
      "example_en": "English translation"
    }

    RULES:
    - Only VERBS, ADJECTIVES, NOUNS (not adverbs, prepositions, conjunctions)
    - Skip if it's not a real study word (meta-words like "grammatik", "modultest", etc.)
    - Skip very common words: være, have, kunne, ville, skulle, måtte, gøre, gå, komme
    - Skip proper nouns
    - Be accurate with inflections — learners depend on this
    - Return ONLY a valid JSON array. Skip words you can't classify.
""").strip()

VOCAB_BATCH_SIZE = 30


def run_vocab(client: anthropic.Anthropic, write: bool) -> None:
    vocab_path = _latest("seed-vocabulary-extracted.json")
    if not vocab_path:
        print("ERROR: No seed-vocabulary-extracted.json found")
        return

    print(f"Loading: {vocab_path.name}")
    candidates = json.loads(vocab_path.read_text(encoding="utf-8"))
    print(f"  {len(candidates)} candidate words")

    # Load existing for dedup
    existing_words = json.loads(WORDS_FILE.read_text(encoding="utf-8")) if WORDS_FILE.exists() else []
    existing_danish = {w["danish"].strip().lower() for w in existing_words}
    print(f"  Existing vocabulary: {len(existing_danish)} words")

    # Filter out already-enriched words and existing ones
    to_enrich = [
        w for w in candidates
        if w["danish"].strip().lower() not in existing_danish
        and not w.get("english")  # not already enriched
    ]
    print(f"  To enrich: {len(to_enrich)} words")

    # Sort by occurrence count (most frequent first)
    to_enrich.sort(key=lambda w: w.get("occurrence_count", 0), reverse=True)

    batches = [to_enrich[i:i + VOCAB_BATCH_SIZE]
               for i in range(0, len(to_enrich), VOCAB_BATCH_SIZE)]
    print(f"  Batches: {len(batches)}")

    all_enriched: list[dict] = []
    new_danish: set[str] = set()

    for batch_idx, batch in enumerate(batches):
        print(f"  Batch {batch_idx + 1}/{len(batches)}...", end=" ", flush=True)

        word_list = "\n".join(
            f"  {i+1}. {w['danish']}"
            + (f" (appears {w['occurrence_count']}x)" if w.get("occurrence_count") else "")
            for i, w in enumerate(batch)
        )
        prompt = f"Classify and enrich these Danish words:\n\n{word_list}\n\nReturn JSON array."

        try:
            response = call_claude(client, prompt, VOCAB_SYSTEM)
            parsed = parse_json_array(response)
        except Exception as e:
            print(f"ERROR: {e}")
            time.sleep(1)
            continue

        if not parsed:
            print("PARSE ERROR")
            continue

        added = 0
        for word in parsed:
            danish = (word.get("danish") or "").strip().lower()
            if not danish or not word.get("english") or not word.get("part_of_speech"):
                continue
            if word["part_of_speech"] not in ("verb", "adjective", "noun"):
                continue
            if danish in existing_danish or danish in new_danish:
                continue

            word["danish"] = danish
            word["module_level"] = 3
            word["source"] = "speakspeak-dump"
            all_enriched.append(word)
            new_danish.add(danish)
            added += 1

        print(f"OK (+{added} words)")
        time.sleep(0.3)

    print(f"\n{'='*50}")
    print(f"Total enriched: {len(all_enriched)} words")

    if all_enriched:
        pos = Counter(w["part_of_speech"] for w in all_enriched)
        print(f"  By POS: {dict(pos)}")

        out_path = DATA_DIR / "enriched-vocabulary.json"
        out_path.write_text(json.dumps(all_enriched, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"  Saved: {out_path}")

        if write:
            merged = existing_words + all_enriched
            WORDS_FILE.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"  MERGED into {WORDS_FILE} ({len(merged)} total)")


# ---------------------------------------------------------------------------
# Step 5: Verify exercises
# ---------------------------------------------------------------------------
VERIFY_SYSTEM = textwrap.dedent("""
    You are a Danish language expert reviewing quiz exercises for PD3 Module 2.

    For each exercise, check:
    1. Is the correct_answer actually correct Danish?
    2. Is the question clear and unambiguous?
    3. For cloze: does the blank have exactly one correct answer?
    4. For multiple_choice: are the alternatives plausible but wrong?

    Return ONLY a JSON array with one object per exercise:
    {
      "index": <exercise number>,
      "answer_correct": true|false,
      "issue": "<problem description or empty string>",
      "suggested_answer": "<corrected answer if wrong, else empty>",
      "quality": "good" | "needs_review" | "bad"
    }
""").strip()

VERIFY_BATCH_SIZE = 10


def run_verify(client: anthropic.Anthropic) -> None:
    gen_path = DATA_DIR / "generated-exercises.json"
    if not gen_path.exists():
        # Fall back to seed file
        gen_path = EXERCISES_FILE

    print(f"Loading: {gen_path.name}")
    exercises = json.loads(gen_path.read_text(encoding="utf-8"))
    print(f"  {len(exercises)} exercises to verify")

    batches = [exercises[i:i + VERIFY_BATCH_SIZE]
               for i in range(0, len(exercises), VERIFY_BATCH_SIZE)]

    results: list[dict] = []
    issues_count = 0

    for batch_idx, batch in enumerate(batches):
        start_idx = batch_idx * VERIFY_BATCH_SIZE
        print(f"  Batch {batch_idx + 1}/{len(batches)}...", end=" ", flush=True)

        items_text = []
        for i, ex in enumerate(batch):
            idx = start_idx + i
            parts = [f"#{idx}: [{ex.get('exercise_type', '?')}]"]
            parts.append(f"  Q: {ex.get('question', '')[:200]}")
            parts.append(f"  A: {ex.get('correct_answer', '')}")
            if ex.get("alternatives"):
                parts.append(f"  Wrong: {', '.join(str(a) for a in ex['alternatives'][:3])}")
            items_text.append("\n".join(parts))

        prompt = "Verify these Danish exercises:\n\n" + "\n\n".join(items_text)

        try:
            response = call_claude(client, prompt, VERIFY_SYSTEM)
            parsed = parse_json_array(response)
        except Exception as e:
            print(f"ERROR: {e}")
            time.sleep(1)
            continue

        if parsed:
            batch_issues = sum(1 for r in parsed if not r.get("answer_correct", True))
            issues_count += batch_issues
            results.extend(parsed)
            print(f"OK ({batch_issues} issues)")
        else:
            print("PARSE ERROR")

        time.sleep(0.3)

    print(f"\n{'='*50}")
    print(f"Verified: {len(results)} exercises")
    print(f"Issues found: {issues_count}")

    # Write report
    report_dir = PROJECT_ROOT / "docs" / "reviews"
    report_dir.mkdir(parents=True, exist_ok=True)

    lines = [
        "# Exercise Verification Report",
        "",
        f"**Source:** {gen_path.name}",
        f"**Total:** {len(exercises)}",
        f"**Verified:** {len(results)}",
        f"**Issues:** {issues_count}",
        "",
    ]

    bad = [r for r in results if not r.get("answer_correct", True) or r.get("quality") == "bad"]
    if bad:
        lines.append("## Issues")
        lines.append("")
        for r in bad:
            idx = r.get("index", "?")
            ex = exercises[idx] if isinstance(idx, int) and idx < len(exercises) else {}
            lines.append(f"### #{idx}")
            lines.append(f"- **Q:** {ex.get('question', '')[:150]}")
            lines.append(f"- **A:** `{ex.get('correct_answer', '')}`")
            if r.get("suggested_answer"):
                lines.append(f"- **Suggested:** `{r['suggested_answer']}`")
            lines.append(f"- **Issue:** {r.get('issue', '')}")
            lines.append("")
    else:
        lines.append("_No issues found._")

    report_path = report_dir / "dump-exercise-verification.md"
    report_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"  Report: {report_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate exercises and enrich vocabulary from SpeakSpeak dump"
    )
    parser.add_argument("step", choices=["exercises", "vocab", "verify", "all"],
                        help="Which step to run")
    parser.add_argument("--write", action="store_true",
                        help="Write results to seed files")
    parser.add_argument("--limit", type=int, default=None,
                        help="Limit number of source URLs to process (for testing)")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    if args.step in ("exercises", "all"):
        print("\n[Step 3] Generating exercises from dump...")
        run_exercises(client, args.write, args.limit)

    if args.step in ("vocab", "all"):
        print("\n[Step 4] Enriching vocabulary...")
        run_vocab(client, args.write)

    if args.step in ("verify", "all"):
        print("\n[Step 5] Verifying exercises...")
        run_verify(client)

    print("\nDone!")


if __name__ == "__main__":
    main()
