#!/usr/bin/env python3
"""Fix the 10 hints that weren't found by the first script (newlines in question text, different prefixes)."""

import json
from pathlib import Path

EXERCISES_PATH = Path(__file__).parent.parent / "src" / "data" / "seed" / "exercises-pd3m2.json"

# These use exact substring matching on the question text
FIXES = {
    "Lav om til indirekte tale: De siger: 'Spis varieret.'": "Imperative → 'at man skal' (that one should) + infinitive",
    "Lav om til indirekte tale: De siger: 'Drik meget vand.'": "Imperative → 'at man skal' (that one should) + infinitive",
    "A: Hvordan går det? B: Det går godt. ___ med dig?": "Fixed expression: asking back (use 'Hvad')",
    "Omskriv som imperativ:\n\nKartoflerne skrælles": "Use the imperative mood and remember to change the pronouns.",
    "Omskriv som imperativ:\n\nKødes skæres i tern": "'Kødet' (the meat) is a neuter noun, so use pronoun 'det' (it).",
    "Omskriv som imperativ:\n\nPersillen skylles": "'Persillen' (the parsley) is a common gender noun, so use pronoun 'den' (it).",
    "Omskriv som imperativ:\n\nPastaen koges": "Two verbs here: 'koges' and 'hældes'. Rewrite both to imperative.",
    "Omskriv som imperativ:\n\nSmør og sukker piskes": "'Tilsæt' is the imperative of 'tilsætte' (to add).",
    "Omskriv som imperativ:\n\nMel og bagepulver blandes": "'Mel og bagepulver' (flour and baking powder) is plural, so the pronoun is 'dem' (them).",
    "Omskriv som imperativ:\n\nKagen bages i 50 minutter": "'Afkøle' means to cool down. 'Kagen' (the cake) is an en-noun, so the pronoun is 'den' (it).",
}


def main():
    with open(EXERCISES_PATH, "r", encoding="utf-8") as f:
        exercises = json.load(f)

    applied = 0
    for question_fragment, new_hint in FIXES.items():
        found = False
        for ex in exercises:
            q = ex.get("question", "")
            if question_fragment in q:
                old_hint = ex.get("hint", "(none)")
                ex["hint"] = new_hint
                applied += 1
                found = True
                print(f"  ✓ Updated: {q[:70]}...")
                print(f"    Old: {old_hint[:60]}")
                print(f"    New: {new_hint[:60]}")
                break
        if not found:
            print(f"  ✗ NOT FOUND: {question_fragment[:70]}")

    print(f"\nApplied {applied}/{len(FIXES)} fixes")

    with open(EXERCISES_PATH, "w", encoding="utf-8") as f:
        json.dump(exercises, f, ensure_ascii=False, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main()
