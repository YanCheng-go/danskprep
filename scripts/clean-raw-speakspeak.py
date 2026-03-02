"""
Remove raw multi-blank SpeakSpeak exercises from exercises-pd3m2.json
and merge in cleaned single-blank replacements from exercises-pd3m2-split.json.
"""
from __future__ import annotations

import json
from pathlib import Path

SEED_DIR = Path(__file__).resolve().parent.parent / "src" / "data" / "seed"
MAIN_FILE = SEED_DIR / "exercises-pd3m2.json"
SPLIT_FILE = SEED_DIR / "exercises-pd3m2-split.json"


def normalize_question(q: str) -> str:
    """Simple normalisation for dedup comparison."""
    return q.strip().lower().replace("  ", " ")


def is_raw_speakspeak(e: dict) -> bool:
    """Detect unusable raw multi-blank exercises."""
    return (
        e.get("source") == "speakspeak"
        and e.get("difficulty") == 3
        and not e.get("alternatives")
        and len(e.get("question", "")) > 200
    )


def main() -> None:
    with open(MAIN_FILE, encoding="utf-8") as f:
        main_exercises: list[dict] = json.load(f)

    with open(SPLIT_FILE, encoding="utf-8") as f:
        split_exercises: list[dict] = json.load(f)

    # Count and remove raw exercises
    raw_count = sum(1 for e in main_exercises if is_raw_speakspeak(e))
    cleaned = [e for e in main_exercises if not is_raw_speakspeak(e)]
    print(f"Removed {raw_count} raw multi-blank exercises")
    print(f"Remaining: {len(cleaned)} exercises")

    # Build set of existing normalised questions for dedup
    existing_questions = {normalize_question(e["question"]) for e in cleaned}

    # Merge non-duplicate split exercises
    added = 0
    skipped = 0
    for e in split_exercises:
        nq = normalize_question(e["question"])
        if nq in existing_questions:
            skipped += 1
        else:
            cleaned.append(e)
            existing_questions.add(nq)
            added += 1

    print(f"Added {added} exercises from split file ({skipped} duplicates skipped)")
    print(f"Final total: {len(cleaned)} exercises")

    # Write back
    with open(MAIN_FILE, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Wrote {MAIN_FILE}")


if __name__ == "__main__":
    main()
