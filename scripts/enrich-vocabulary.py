#!/usr/bin/env python3
"""
enrich-vocabulary.py

Uses Claude API to extract vocabulary (verbs, adjectives, nouns) from scraped
SpeakSpeak exercises and merges them into words-pd3m2.json.

The LLM identifies words in the exercise sentences, classifies them by POS,
and provides correct Danish inflections for each word.

Usage:
  cd scripts
  uv run python enrich-vocabulary.py

Requirements:
  ANTHROPIC_API_KEY environment variable must be set.
  Run `uv sync` to install dependencies (anthropic is listed in pyproject.toml).

Output:
  Appends new words to ../src/data/seed/words-pd3m2.json
  Prints a summary of what was added.
"""

from __future__ import annotations

import json
import os
import sys
import textwrap
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: Run: cd scripts && uv sync")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent.parent
SCRAPED_JSON = PROJECT_ROOT / "scripts/data/_speakspeak_raw_pd3m2_20260301_192523.json"
WORDS_JSON = PROJECT_ROOT / "src/data/seed/words-pd3m2.json"

# How many exercise questions to send per API call (batched to stay within token limits)
BATCH_SIZE = 20

SYSTEM_PROMPT = textwrap.dedent("""
    You are a Danish linguistics expert helping build a vocabulary database for a PD3 Module 2
    Danish language exam preparation app.

    Your task: extract vocabulary words from Danish exercise sentences, with full inflection data.

    Rules:
    - Only extract VERBS, ADJECTIVES, and NOUNS (not adverbs, prepositions, conjunctions, pronouns)
    - For verbs: provide infinitive form (without 'at')
    - For adjectives: provide the base (en-noun) form
    - For nouns: provide the indefinite singular form
    - Only words relevant to PD3 Module 2 exam level (everyday Danish, B1-B2)
    - Skip very common words already in basic vocabulary (være, have, kunne, ville, skulle, måtte)
    - Skip proper nouns (names like Peter, Anna, etc.)
    - Be accurate with Danish inflections — these will be shown to language learners

    For each word, provide a JSON object with:
    {
      "danish": "infinitive/base form",
      "english": "English translation",
      "part_of_speech": "verb" | "adjective" | "noun",
      "gender": null for verbs/adjectives, "en" or "et" for nouns,
      "tags": ["tag1", "tag2"],  // semantic tags like ["food", "daily"], ["movement"], ["emotion"]
      "difficulty": 1 | 2 | 3,  // 1=very common, 2=moderate, 3=less common
      "inflections": {
        // For verbs:
        "present": "...", "past": "...", "perfect": "har/er ...", "imperative": "..."
        // For adjectives:
        "t_form": "...", "e_form": "...", "comparative": "...", "superlative": "..."
        // For nouns:
        "definite": "...", "plural_indef": "...", "plural_def": "..."
      },
      "example_da": "Example sentence in Danish using the word",
      "example_en": "English translation of the example sentence"
    }

    Return ONLY a valid JSON array. No markdown, no explanation, just the JSON array.
""").strip()


def extract_sentences(exercises: list[dict]) -> list[str]:
    """Pull question text from scraped exercises, skipping very long multi-blank ones."""
    sentences = []
    for ex in exercises:
        q = ex.get("question", "").strip()
        # Skip questions that are too long (multi-blank fill-all exercises)
        if q and 20 < len(q) < 400:
            sentences.append(q)
    return sentences


def call_claude(client: anthropic.Anthropic, sentences: list[str]) -> list[dict]:
    """Call Claude to extract vocabulary from a batch of sentences."""
    user_message = (
        "Extract vocabulary from these Danish exercise sentences:\n\n"
        + "\n".join(f"{i+1}. {s}" for i, s in enumerate(sentences))
    )

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = message.content[0].text.strip()

    # Extract JSON array from response (handles any surrounding text)
    start = raw.find("[")
    end = raw.rfind("]") + 1
    if start == -1 or end == 0:
        print(f"  WARNING: No JSON array found in response chunk. Response was:\n  {raw[:200]}")
        return []

    try:
        return json.loads(raw[start:end])
    except json.JSONDecodeError as e:
        print(f"  WARNING: JSON parse error: {e}")
        return []


def validate_word(word: dict) -> bool:
    """Basic validation — skip malformed entries."""
    required = ["danish", "english", "part_of_speech", "inflections"]
    if not all(k in word for k in required):
        return False
    if word["part_of_speech"] not in ("verb", "adjective", "noun"):
        return False
    if not isinstance(word["inflections"], dict):
        return False
    return True


def normalize_word(word: dict, module_level: int = 3) -> dict:
    """Ensure required fields are present with correct defaults."""
    return {
        "danish": word["danish"].strip().lower(),
        "english": word.get("english", ""),
        "part_of_speech": word["part_of_speech"],
        "gender": word.get("gender"),
        "module_level": module_level,
        "difficulty": word.get("difficulty", 2),
        "tags": word.get("tags", []),
        "inflections": word.get("inflections", {}),
        "example_da": word.get("example_da"),
        "example_en": word.get("example_en"),
        "source": "speakspeak",
    }


def main() -> None:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY environment variable not set.")
        print("  Export it: export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    if not SCRAPED_JSON.exists():
        print(f"ERROR: Scraped file not found: {SCRAPED_JSON}")
        sys.exit(1)

    # Load scraped exercises
    with open(SCRAPED_JSON, encoding="utf-8") as f:
        exercises = json.load(f)
    print(f"Loaded {len(exercises)} scraped exercises")

    # Load existing words
    with open(WORDS_JSON, encoding="utf-8") as f:
        existing_words = json.load(f)
    existing_danish = {w["danish"].strip().lower() for w in existing_words}
    print(f"Existing vocabulary: {len(existing_words)} words")

    # Extract sentences
    sentences = extract_sentences(exercises)
    print(f"Extracted {len(sentences)} usable sentences")

    client = anthropic.Anthropic(api_key=api_key)

    # Process in batches
    all_extracted: list[dict] = []
    batches = [sentences[i:i + BATCH_SIZE] for i in range(0, len(sentences), BATCH_SIZE)]
    print(f"Processing {len(batches)} batch(es) of up to {BATCH_SIZE} sentences each...")

    for i, batch in enumerate(batches):
        print(f"  Batch {i+1}/{len(batches)} ({len(batch)} sentences)...")
        extracted = call_claude(client, batch)
        all_extracted.extend(extracted)
        print(f"    → {len(extracted)} words extracted")

    print(f"\nTotal extracted (before dedup): {len(all_extracted)}")

    # Validate, normalize, and deduplicate
    new_words: list[dict] = []
    skipped_invalid = 0
    skipped_duplicate = 0

    for raw_word in all_extracted:
        if not validate_word(raw_word):
            skipped_invalid += 1
            continue
        normalized = normalize_word(raw_word)
        key = normalized["danish"]
        if key in existing_danish:
            skipped_duplicate += 1
            continue
        new_words.append(normalized)
        existing_danish.add(key)

    print(f"Skipped invalid: {skipped_invalid}")
    print(f"Skipped duplicates: {skipped_duplicate}")
    print(f"New words to add: {len(new_words)}")

    if not new_words:
        print("Nothing to add — vocabulary is already complete.")
        return

    # Show preview
    print("\nNew words:")
    for w in new_words:
        inf_keys = list(w["inflections"].keys())[:2]
        inf_preview = ", ".join(f"{k}: {w['inflections'][k]}" for k in inf_keys)
        print(f"  [{w['part_of_speech']}] {w['danish']} — {w['english']} ({inf_preview})")

    # Confirm before writing
    answer = input(f"\nAdd {len(new_words)} words to words-pd3m2.json? [y/N] ").strip().lower()
    if answer != "y":
        print("Aborted.")
        return

    merged = existing_words + new_words
    with open(WORDS_JSON, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"\nDone. words-pd3m2.json now has {len(merged)} entries.")
    print(f"  Added: {len(new_words)} words  ({sum(1 for w in new_words if w['part_of_speech'] == 'verb')} verbs,"
          f" {sum(1 for w in new_words if w['part_of_speech'] == 'adjective')} adjectives,"
          f" {sum(1 for w in new_words if w['part_of_speech'] == 'noun')} nouns)")


if __name__ == "__main__":
    main()
