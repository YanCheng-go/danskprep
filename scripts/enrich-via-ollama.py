#!/usr/bin/env python3
"""
enrich-via-ollama.py

Uses a local Ollama model to fill in missing verb inflections in words-pd3m2.json.

Usage:
    cd scripts
    uv run python enrich-via-ollama.py

Requires: Ollama running locally with gemma3:latest model.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

PROJECT_ROOT = Path(__file__).parent.parent
WORDS_JSON = PROJECT_ROOT / "src" / "data" / "seed" / "words-pd3m2.json"

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma3:latest"

# Process verbs in batches to reduce API calls
BATCH_SIZE = 10


def call_ollama(prompt: str) -> str:
    """Call Ollama generate API and return the full response text."""
    payload = json.dumps({
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 4096,
        },
    }).encode("utf-8")

    req = Request(
        OLLAMA_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result.get("response", "")
    except URLError as e:
        print(f"  ERROR: Ollama request failed: {e}")
        return ""


def build_batch_prompt(verbs: list[dict]) -> str:
    """Build a prompt for a batch of verbs."""
    verb_list = "\n".join(
        f'{i+1}. {v["danish"]} (English: {v["english"]})'
        for i, v in enumerate(verbs)
    )

    return f"""You are a Danish language expert. For each Danish verb below, provide the correct conjugation forms.

Return ONLY a valid JSON array with one object per verb. No explanation, no markdown code fences, just the raw JSON array.

Each object must have exactly these fields:
- "danish": the infinitive form (same as input)
- "present": present tense (e.g., "spiser" for "spise")
- "past": past tense / preterite (e.g., "spiste" for "spise")
- "perfect": perfect tense with har/er (e.g., "har spist" for "spise")
- "imperative": imperative form (e.g., "spis" for "spise")

Examples of correct output format:
[
  {{"danish": "spise", "present": "spiser", "past": "spiste", "perfect": "har spist", "imperative": "spis"}},
  {{"danish": "gå", "present": "går", "past": "gik", "perfect": "er gået", "imperative": "gå"}}
]

Here are the verbs:
{verb_list}

Return the JSON array now:"""


def parse_response(text: str, expected_count: int) -> list[dict] | None:
    """Parse the JSON array from Ollama's response."""
    text = text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json or ```) and last line (```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    # Find JSON array
    start = text.find("[")
    end = text.rfind("]") + 1
    if start == -1 or end == 0:
        return None

    try:
        data = json.loads(text[start:end])
        if not isinstance(data, list):
            return None
        return data
    except json.JSONDecodeError:
        return None


def enrich_verb(word: dict, inflection_data: dict) -> dict:
    """Apply inflection data to a word entry."""
    word["inflections"] = {
        "present": inflection_data.get("present", ""),
        "past": inflection_data.get("past", ""),
        "perfect": inflection_data.get("perfect", ""),
        "imperative": inflection_data.get("imperative", ""),
    }
    return word


def main() -> None:
    # Verify Ollama is running
    try:
        urlopen("http://localhost:11434/api/tags", timeout=5)
    except URLError:
        print("ERROR: Ollama is not running. Start it with: ollama serve")
        sys.exit(1)

    print(f"Using model: {MODEL}")

    # Load words
    with open(WORDS_JSON, encoding="utf-8") as f:
        words = json.load(f)

    # Find verbs with empty inflections
    verbs_to_enrich = [
        (i, w) for i, w in enumerate(words)
        if w["part_of_speech"] == "verb"
        and (not w.get("inflections") or w["inflections"] == {})
    ]

    print(f"Total words: {len(words)}")
    print(f"Verbs needing inflections: {len(verbs_to_enrich)}")

    if not verbs_to_enrich:
        print("All verbs already have inflections!")
        return

    # Process in batches
    enriched_count = 0
    failed_verbs: list[str] = []
    batches = [
        verbs_to_enrich[i:i + BATCH_SIZE]
        for i in range(0, len(verbs_to_enrich), BATCH_SIZE)
    ]

    print(f"Processing {len(batches)} batches of up to {BATCH_SIZE} verbs...\n")

    for batch_idx, batch in enumerate(batches):
        batch_words = [w for _, w in batch]
        batch_indices = [i for i, _ in batch]

        print(f"Batch {batch_idx + 1}/{len(batches)}: {', '.join(w['danish'] for w in batch_words)}")

        prompt = build_batch_prompt(batch_words)
        response = call_ollama(prompt)

        if not response:
            print("  FAILED: Empty response")
            failed_verbs.extend(w["danish"] for w in batch_words)
            continue

        parsed = parse_response(response, len(batch_words))
        if not parsed:
            print(f"  FAILED: Could not parse JSON from response")
            print(f"  Response preview: {response[:200]}")
            failed_verbs.extend(w["danish"] for w in batch_words)
            continue

        # Match results back to words by danish field
        result_map = {r["danish"].lower(): r for r in parsed if "danish" in r}

        for idx, word in zip(batch_indices, batch_words):
            key = word["danish"].lower()
            if key in result_map:
                enrich_verb(words[idx], result_map[key])
                enriched_count += 1
                inf = words[idx]["inflections"]
                print(f"  + {word['danish']}: {inf['present']}, {inf['past']}, {inf['perfect']}, {inf['imperative']}")
            else:
                # Try matching by position if map lookup fails
                pos = batch_words.index(word)
                if pos < len(parsed):
                    enrich_verb(words[idx], parsed[pos])
                    enriched_count += 1
                    inf = words[idx]["inflections"]
                    print(f"  + {word['danish']} (positional): {inf['present']}, {inf['past']}, {inf['perfect']}, {inf['imperative']}")
                else:
                    failed_verbs.append(word["danish"])
                    print(f"  - {word['danish']}: NOT FOUND in response")

        # Small delay between batches to avoid overloading
        if batch_idx < len(batches) - 1:
            time.sleep(1)

    # Write back
    print(f"\n{'=' * 50}")
    print(f"Enriched: {enriched_count}/{len(verbs_to_enrich)} verbs")
    if failed_verbs:
        print(f"Failed: {len(failed_verbs)} verbs: {', '.join(failed_verbs)}")

    if enriched_count > 0:
        with open(WORDS_JSON, "w", encoding="utf-8") as f:
            json.dump(words, f, ensure_ascii=False, indent=2)
        print(f"\nSaved to {WORDS_JSON}")
    else:
        print("\nNo changes made.")


if __name__ == "__main__":
    main()
