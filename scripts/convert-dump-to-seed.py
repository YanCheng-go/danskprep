#!/usr/bin/env python3
"""
Convert extracted dump exercises into seed exercise format and extract vocabulary.

Reads dump-exercises-*.json (from process-full-dump.py --extract-only) and:
1. Converts to seed exercise format (matching exercises-pd3m2.json schema)
2. Extracts vocabulary words from exercises + dump text
3. Deduplicates against existing seed data
4. Writes new exercises + vocabulary (review before merging)

Usage:
  cd scripts
  uv run python convert-dump-to-seed.py                         # dry-run
  uv run python convert-dump-to-seed.py --write                 # write to seed files
  uv run python convert-dump-to-seed.py --exercises-only        # skip vocabulary
  uv run python convert-dump-to-seed.py --vocab-only            # skip exercises
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
SEED_DIR = PROJECT_ROOT / "src" / "data" / "seed"
EXERCISES_FILE = SEED_DIR / "exercises-pd3m2.json"
WORDS_FILE = SEED_DIR / "words-pd3m2.json"
DUMP_DIR = Path(__file__).parent / "data"
TEXT_DUMP = sorted(DUMP_DIR.glob("dump-text-*.json"), reverse=True)
EXERCISES_DUMP = sorted(DUMP_DIR.glob("dump-exercises-*.json"), reverse=True)

# ---------------------------------------------------------------------------
# Grammar topic inference from H5P activity name
# ---------------------------------------------------------------------------
TOPIC_KEYWORDS: dict[str, list[str]] = {
    "noun-gender": [
        "bestemt", "ubestemt", "substantiv", "en-ord", "et-ord",
        "artikel", "bilen", "huset",
    ],
    "verbs-tenses": [
        "datid", "nutid", "førnutid", "førdatid", "imperati",
        "passiv", "s-passiv", "konjugat", "verbum", "verber",
        "fra nutid til datid", "alle 3 grupper",
    ],
    "inverted-word-order": [
        "inversion", "ledstilling", "ordstilling", "placering af",
        "centraladverbi",
    ],
    "main-subordinate-clauses": [
        "ledsætn", "hovedsætn", "konjunktion", "at-sætning",
        "fordi", "når", "hvis", "da", "der/som", "som",
        "hv-ord", "om)",
    ],
    "pronouns": [
        "hans", "hendes", "sin", "sit", "sine", "pronomen",
    ],
    "comparative-superlative": [
        "adjektiv", "komparativ", "superlativ",
    ],
}


def infer_grammar_topic(name: str, question: str) -> str:
    """Infer grammar_topic_slug from activity name and question text."""
    combined = (name + " " + question).lower()

    scores: dict[str, int] = {}
    for slug, keywords in TOPIC_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in combined)
        if score > 0:
            scores[slug] = score

    if scores:
        return max(scores, key=scores.get)  # type: ignore[arg-type]

    # Fallback heuristics
    if "ordforråd" in combined or "opsamling" in combined:
        return "verbs-tenses"  # vocabulary review exercises
    if "dialog" in combined or "lyt" in combined:
        return "main-subordinate-clauses"
    return "verbs-tenses"  # safe default


def infer_difficulty(question: str, h5p_type: str) -> int:
    """Infer difficulty 1-3 from question characteristics."""
    q_len = len(question)
    if h5p_type == "singlechoiceset":
        return 1  # multiple choice is easier
    if q_len > 300:
        return 3
    if q_len > 150:
        return 2
    return 1


# ---------------------------------------------------------------------------
# Exercise conversion
# ---------------------------------------------------------------------------
def clean_question(question: str) -> str:
    """Clean up question text for seed format."""
    # Remove HTML entities
    q = re.sub(r"&nbsp;", " ", question)
    q = re.sub(r"&amp;", "&", q)
    q = re.sub(r"<[^>]+>", "", q)
    q = re.sub(r"\s+", " ", q).strip()
    return q


def convert_exercises(dump_exercises: list[dict]) -> list[dict]:
    """Convert dump exercises to seed format."""
    seed_exercises: list[dict] = []

    for ex in dump_exercises:
        question = clean_question(ex.get("question", ""))
        correct = ex.get("correct_answer", "").strip()
        if not question or not correct:
            continue

        etype = ex.get("exercise_type", "cloze")
        h5p_type = ex.get("raw", {}).get("h5p_type", "")
        name = ex.get("source_name", "")
        hint = ex.get("hint", "")

        # Skip audio-only exercises (no text content)
        if not question or question == "___":
            continue

        # Build seed exercise
        seed_ex: dict = {
            "grammar_topic_slug": infer_grammar_topic(name, question),
            "exercise_type": etype,
            "question": question,
            "correct_answer": correct,
            "module_level": 3,
            "difficulty": infer_difficulty(question, h5p_type),
            "source": "speakspeak-dump",
        }

        # Add optional fields
        if hint:
            seed_ex["hint"] = hint
        if ex.get("alternatives"):
            seed_ex["alternatives"] = ex["alternatives"]

        # For multi-blank cloze: add blank context
        total_blanks = ex.get("total_blanks", 1)
        blank_index = ex.get("blank_index", 0)
        if total_blanks > 1:
            seed_ex["hint"] = (
                f"Blank {blank_index + 1}/{total_blanks}"
                + (f" — {hint}" if hint else "")
            )

        seed_exercises.append(seed_ex)

    return seed_exercises


def deduplicate_exercises(
    new: list[dict], existing: list[dict]
) -> list[dict]:
    """Remove exercises that match existing ones by question+answer."""
    existing_keys: set[tuple[str, str]] = set()
    for e in existing:
        q = e.get("question", "").strip().lower()[:80]
        a = e.get("correct_answer", "").strip().lower()
        existing_keys.add((q, a))

    kept: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for e in new:
        q = e["question"].strip().lower()[:80]
        a = e["correct_answer"].strip().lower()
        key = (q, a)
        if key in existing_keys or key in seen:
            continue
        kept.append(e)
        seen.add(key)

    return kept


# ---------------------------------------------------------------------------
# Vocabulary extraction (no LLM — pattern-based)
# ---------------------------------------------------------------------------
# Common Danish words to skip
SKIP_WORDS = {
    "er", "har", "kan", "vil", "skal", "må", "jeg", "du", "han", "hun",
    "den", "det", "de", "vi", "i", "en", "et", "og", "at", "på", "til",
    "med", "for", "af", "om", "fra", "der", "som", "ikke", "men", "eller",
    "så", "da", "når", "hvis", "fordi", "hvor", "hvad", "hvem", "hvordan",
    "også", "meget", "mere", "mest", "mange", "alle", "hver", "denne",
    "dette", "disse", "min", "din", "sin", "hans", "hendes", "vores",
    "sig", "mig", "dig", "os", "dem", "noget", "nogen", "ingen",
    "ja", "nej", "okay", "hej", "tak", "god", "godt", "stor", "lille",
    "ny", "gammel", "ung", "lang", "kort", "her", "efter", "før",
    "over", "under", "ved", "hos", "mellem", "mod", "uden",
    "selv", "igen", "jo", "nu", "alt", "hele", "kun", "lige",
    "andre", "andet", "være", "have", "kunne", "ville", "skulle",
    "måtte", "gøre", "gå", "komme", "tage", "se", "sige", "give",
    "blive", "finde", "stå", "ligge", "sidde", "lægge", "sætte",
    "blev", "fik", "var", "havde", "gik", "kom", "tog", "sagde",
    "x", "a", "b", "c", "1", "2", "3",
}


def extract_vocabulary_from_exercises(exercises: list[dict]) -> list[dict]:
    """Extract potential vocabulary words from exercise answers and hints."""
    word_contexts: dict[str, list[str]] = {}  # word → list of contexts

    for ex in exercises:
        answer = ex.get("correct_answer", "").strip()
        question = ex.get("question", "")

        # Extract from cloze answers (these are real Danish words in context)
        if ex.get("exercise_type") == "cloze" and answer:
            words = answer.split()
            for w in words:
                w_clean = re.sub(r"[,.!?;:\"']", "", w).strip().lower()
                if len(w_clean) >= 3 and w_clean not in SKIP_WORDS:
                    ctx = question[:100] if question else ""
                    if w_clean not in word_contexts:
                        word_contexts[w_clean] = []
                    word_contexts[w_clean].append(ctx)

    # Build vocabulary list (words appearing in 2+ exercises are more reliable)
    vocab: list[dict] = []
    for word, contexts in sorted(word_contexts.items()):
        vocab.append({
            "danish": word,
            "english": "",  # needs manual/LLM fill
            "part_of_speech": "",  # needs manual/LLM fill
            "gender": None,
            "module_level": 3,
            "difficulty": 1,
            "source": "speakspeak-dump",
            "occurrence_count": len(contexts),
            "example_context": contexts[0] if contexts else "",
        })

    return vocab


def extract_vocabulary_from_text(text_items: list[dict]) -> list[dict]:
    """Extract potential vocabulary words from page text content."""
    # Simple word frequency extraction from Danish text
    word_freq: Counter = Counter()

    for item in text_items:
        text = item.get("text", "")
        # Tokenize: split on whitespace and punctuation
        words = re.findall(r"[a-zæøåA-ZÆØÅ]{3,}", text)
        for w in words:
            w_lower = w.lower()
            if w_lower not in SKIP_WORDS and len(w_lower) >= 3:
                word_freq[w_lower] += 1

    # Keep all words (frequency >= 1)
    vocab: list[dict] = []
    for word, count in word_freq.most_common():
        if count >= 1:
            vocab.append({
                "danish": word,
                "english": "",
                "part_of_speech": "",
                "gender": None,
                "module_level": 3,
                "difficulty": 1,
                "source": "speakspeak-text",
                "occurrence_count": count,
            })

    return vocab


def deduplicate_vocabulary(
    new_words: list[dict], existing_words: list[dict]
) -> list[dict]:
    """Remove words that already exist in seed vocabulary."""
    existing_danish = {w["danish"].strip().lower() for w in existing_words}

    kept: list[dict] = []
    seen: set[str] = set()
    for w in new_words:
        d = w["danish"].strip().lower()
        if d in existing_danish or d in seen:
            continue
        kept.append(w)
        seen.add(d)

    return kept


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert dump exercises to seed format + extract vocabulary"
    )
    parser.add_argument("--write", action="store_true",
                        help="Write converted exercises to seed file")
    parser.add_argument("--exercises-only", action="store_true",
                        help="Skip vocabulary extraction")
    parser.add_argument("--vocab-only", action="store_true",
                        help="Skip exercise conversion")
    parser.add_argument("--dump-exercises", type=str, default=None,
                        help="Path to dump-exercises-*.json (default: latest)")
    parser.add_argument("--dump-text", type=str, default=None,
                        help="Path to dump-text-*.json (default: latest)")
    args = parser.parse_args()

    # Find input files
    ex_path = Path(args.dump_exercises) if args.dump_exercises else (
        EXERCISES_DUMP[0] if EXERCISES_DUMP else None
    )
    text_path = Path(args.dump_text) if args.dump_text else (
        TEXT_DUMP[0] if TEXT_DUMP else None
    )

    # Load existing seed data
    existing_exercises = json.loads(EXERCISES_FILE.read_text(encoding="utf-8")) if EXERCISES_FILE.exists() else []
    existing_words = json.loads(WORDS_FILE.read_text(encoding="utf-8")) if WORDS_FILE.exists() else []
    print(f"Existing seed: {len(existing_exercises)} exercises, {len(existing_words)} words")

    # ── Exercise conversion ──
    if not args.vocab_only and ex_path and ex_path.exists():
        print(f"\n[1] Converting exercises from {ex_path.name}")
        dump_exercises = json.loads(ex_path.read_text(encoding="utf-8"))
        print(f"  Raw dump exercises: {len(dump_exercises)}")

        seed_exercises = convert_exercises(dump_exercises)
        print(f"  Converted to seed format: {len(seed_exercises)}")

        # Topic distribution
        topics = Counter(e["grammar_topic_slug"] for e in seed_exercises)
        print("  Topics:")
        for t, c in topics.most_common():
            print(f"    {t}: {c}")

        # Deduplicate
        unique = deduplicate_exercises(seed_exercises, existing_exercises)
        print(f"  After dedup: {len(unique)} new ({len(seed_exercises) - len(unique)} duplicates)")

        # Write
        out_path = DUMP_DIR / "seed-exercises-converted.json"
        out_path.write_text(
            json.dumps(unique, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"  Written: {out_path}")

        if args.write and unique:
            merged = existing_exercises + unique
            EXERCISES_FILE.write_text(
                json.dumps(merged, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            print(f"  MERGED into {EXERCISES_FILE} ({len(merged)} total)")
    elif not args.vocab_only:
        print("\n[1] No dump exercises found — skipping")

    # ── Vocabulary extraction ──
    if not args.exercises_only:
        print("\n[2] Extracting vocabulary")

        all_vocab: list[dict] = []

        # From exercises
        if ex_path and ex_path.exists():
            dump_exercises = json.loads(ex_path.read_text(encoding="utf-8"))
            ex_vocab = extract_vocabulary_from_exercises(dump_exercises)
            print(f"  From exercises: {len(ex_vocab)} candidate words")
            all_vocab.extend(ex_vocab)

        # From text content
        if text_path and text_path.exists():
            text_items = json.loads(text_path.read_text(encoding="utf-8"))
            text_vocab = extract_vocabulary_from_text(text_items)
            print(f"  From text content: {len(text_vocab)} candidate words")
            all_vocab.extend(text_vocab)

        if not all_vocab:
            print("  No vocabulary candidates found")
            return

        # Deduplicate against existing + internal
        unique_vocab = deduplicate_vocabulary(all_vocab, existing_words)
        print(f"  After dedup vs existing: {len(unique_vocab)} new words")

        # Sort by occurrence count
        unique_vocab.sort(key=lambda w: w.get("occurrence_count", 0), reverse=True)

        out_path = DUMP_DIR / "seed-vocabulary-extracted.json"
        out_path.write_text(
            json.dumps(unique_vocab, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"  Written: {out_path}")
        print(f"  Top 20 words: {', '.join(w['danish'] for w in unique_vocab[:20])}")

        if args.write and unique_vocab:
            # Only merge words that have been filled (english + part_of_speech)
            filled = [w for w in unique_vocab if w.get("english") and w.get("part_of_speech")]
            if filled:
                merged = existing_words + filled
                WORDS_FILE.write_text(
                    json.dumps(merged, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )
                print(f"  MERGED {len(filled)} filled words into {WORDS_FILE}")
            else:
                print("  NOTE: No words have english/part_of_speech filled yet.")
                print("  Run LLM enrichment on seed-vocabulary-extracted.json first,")
                print("  then re-run with --write to merge.")

    print("\nDone!")


if __name__ == "__main__":
    main()
