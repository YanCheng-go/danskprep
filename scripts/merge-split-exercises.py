"""
merge-split-exercises.py
────────────────────────
Merges exercises-pd3m2-split.json (output from split-speakspeak-exercises.py)
into the main exercises-pd3m2.json, deduplicating by question text.

Run AFTER reviewing the split output:
  cd scripts
  uv run python merge-split-exercises.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent.parent
MAIN_FILE = ROOT / "src/data/seed/exercises-pd3m2.json"
SPLIT_FILE = ROOT / "scripts/data/exercises-pd3m2-split.json"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving")
    parser.add_argument("--split-file", default=str(SPLIT_FILE))
    args = parser.parse_args()

    split_path = Path(args.split_file)
    if not split_path.exists():
        print(f"ERROR: {split_path} not found. Run split-speakspeak-exercises.py first.")
        return

    main_exercises = json.loads(MAIN_FILE.read_text(encoding="utf-8"))
    split_exercises = json.loads(split_path.read_text(encoding="utf-8"))

    print(f"Main file: {len(main_exercises)} exercises")
    print(f"Split file: {len(split_exercises)} exercises")

    existing_questions = {e["question"].strip().lower() for e in main_exercises}

    added, skipped = [], 0
    for ex in split_exercises:
        key = ex["question"].strip().lower()
        if key in existing_questions:
            skipped += 1
        else:
            added.append(ex)
            existing_questions.add(key)

    print(f"\nWill add: {len(added)}")
    print(f"Will skip (duplicates): {skipped}")

    by_topic = Counter(e["grammar_topic_slug"] for e in added)
    print("\nNew exercises by topic:")
    for topic, count in sorted(by_topic.items()):
        print(f"  {topic}: +{count}")

    if args.dry_run:
        print("\n[DRY RUN] Not saving.")
        return

    combined = main_exercises + added
    MAIN_FILE.write_text(
        json.dumps(combined, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"\nTotal exercises after merge: {len(combined)}")
    print(f"Saved to {MAIN_FILE}")
    print(f"\nDelete {split_path.name} if no longer needed.")


if __name__ == "__main__":
    main()
