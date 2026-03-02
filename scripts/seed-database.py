#!/usr/bin/env python3
"""
Seed the DanskPrep Supabase database from local JSON files.

Usage:
    SUPABASE_URL=https://xxx.supabase.co \
    SUPABASE_SERVICE_KEY=eyJ... \
    python scripts/seed-database.py

Requires: pip install supabase
"""

import json
import os
import sys
from pathlib import Path

try:
    from supabase import create_client, Client
except ImportError:
    print("Install dependencies: pip install supabase")
    sys.exit(1)

SEED_DIR = Path(__file__).parent.parent / "src" / "data" / "seed"

def get_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.")
        sys.exit(1)
    return create_client(url, key)


def seed_grammar_topics(client: Client) -> None:
    print("Seeding grammar_topics…")
    with open(SEED_DIR / "grammar-pd3m2.json") as f:
        topics = json.load(f)
    client.table("grammar_topics").upsert(topics, on_conflict="slug").execute()
    print(f"  → {len(topics)} topics upserted")


def seed_words(client: Client) -> None:
    print("Seeding words…")
    with open(SEED_DIR / "words-pd3m2.json") as f:
        words = json.load(f)
    # Remove client-side fields not in DB schema
    for w in words:
        w.pop("id", None)
        w.pop("created_at", None)
    client.table("words").upsert(words, on_conflict="danish,part_of_speech").execute()
    print(f"  → {len(words)} words upserted")


def seed_exercises(client: Client) -> None:
    print("Seeding exercises…")
    with open(SEED_DIR / "exercises-pd3m2.json") as f:
        exercises = json.load(f)
    for e in exercises:
        e.pop("id", None)
        e.pop("created_at", None)
        # Ensure required fields
        if not e.get("acceptable_answers"):
            e["acceptable_answers"] = []
        e.setdefault("source", "generated")
    # Delete existing exercises first, then re-insert (no natural unique key —
    # exercises lack a stable composite key for upsert)
    client.table("exercises").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    try:
        client.table("exercises").insert(exercises).execute()
    except Exception as exc:
        print("  ✗ Insert failed after delete — exercises table is now empty!")
        print(f"    Error: {exc}")
        sys.exit(1)
    print(f"  → {len(exercises)} exercises inserted (replaced)")


def seed_sentences(client: Client) -> None:
    print("Seeding sentences…")
    with open(SEED_DIR / "sentences-pd3m2.json") as f:
        sentences = json.load(f)
    for s in sentences:
        s.pop("id", None)
        s.pop("created_at", None)
        s.pop("topic_tags", None)  # not in DB schema; stored in JSON for reference only
        s.setdefault("source", "generated")
    # Delete existing sentences first, then re-insert (no natural unique key —
    # sentences lack a stable composite key for upsert)
    client.table("sentences").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    try:
        client.table("sentences").insert(sentences).execute()
    except Exception as exc:
        print("  ✗ Insert failed after delete — sentences table is now empty!")
        print(f"    Error: {exc}")
        sys.exit(1)
    print(f"  → {len(sentences)} sentences inserted (replaced)")


def main() -> None:
    print("DanskPrep — Database Seeder")
    print("=" * 40)
    client = get_client()
    seed_grammar_topics(client)
    seed_words(client)
    seed_exercises(client)
    seed_sentences(client)
    print("\nDone! ✓")


if __name__ == "__main__":
    main()
