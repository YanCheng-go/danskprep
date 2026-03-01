# Skill: Database Schema & Seed Data

## Migration File

The initial schema lives in `supabase/migrations/001_initial_schema.sql`. Always apply changes through migrations, never edit the database directly.

```sql
-- supabase/migrations/001_initial_schema.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------
-- CONTENT TABLES (read-only for regular users)
--------------------------------------------------

CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  danish TEXT NOT NULL,
  english TEXT NOT NULL,
  part_of_speech TEXT NOT NULL CHECK (part_of_speech IN ('noun', 'verb', 'adjective', 'adverb', 'pronoun', 'conjunction', 'preposition', 'numeral', 'interjection')),
  gender TEXT CHECK (gender IN ('en', 'et', NULL)),
  module_level INT NOT NULL CHECK (module_level BETWEEN 1 AND 6),
  difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  tags TEXT[] DEFAULT '{}',
  inflections JSONB DEFAULT '{}',
  example_da TEXT,
  example_en TEXT,
  audio_url TEXT,
  notes TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_words_module ON words(module_level);
CREATE INDEX idx_words_pos ON words(part_of_speech);
CREATE INDEX idx_words_danish ON words(danish);

CREATE TABLE grammar_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  module_level INT NOT NULL CHECK (module_level BETWEEN 1 AND 6),
  category TEXT NOT NULL,
  explanation TEXT NOT NULL,
  rules JSONB DEFAULT '[]',
  tips TEXT[] DEFAULT '{}',
  common_mistakes TEXT[] DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_grammar_module ON grammar_topics(module_level);
CREATE INDEX idx_grammar_slug ON grammar_topics(slug);

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grammar_topic_id UUID REFERENCES grammar_topics(id) ON DELETE SET NULL,
  word_id UUID REFERENCES words(id) ON DELETE SET NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('type_answer', 'cloze', 'multiple_choice', 'word_order', 'error_correction', 'matching', 'conjugation')),
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  acceptable_answers TEXT[] DEFAULT '{}',
  alternatives TEXT[] DEFAULT '{}',
  hint TEXT,
  explanation TEXT,
  module_level INT NOT NULL CHECK (module_level BETWEEN 1 AND 6),
  difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercises_topic ON exercises(grammar_topic_id);
CREATE INDEX idx_exercises_type ON exercises(exercise_type);
CREATE INDEX idx_exercises_module ON exercises(module_level);

CREATE TABLE sentences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  danish TEXT NOT NULL,
  english TEXT NOT NULL,
  module_level INT NOT NULL CHECK (module_level BETWEEN 1 AND 6),
  topic_tags TEXT[] DEFAULT '{}',
  difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sentences_module ON sentences(module_level);

--------------------------------------------------
-- USER TABLES
--------------------------------------------------

CREATE TABLE user_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN ('word', 'exercise', 'grammar')),
  card_ref_id UUID NOT NULL,
  -- FSRS state
  state INT NOT NULL DEFAULT 0 CHECK (state BETWEEN 0 AND 3),
  difficulty FLOAT NOT NULL DEFAULT 0,
  stability FLOAT NOT NULL DEFAULT 0,
  retrievability FLOAT NOT NULL DEFAULT 0,
  due TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_review TIMESTAMPTZ,
  reps INT NOT NULL DEFAULT 0,
  lapses INT NOT NULL DEFAULT 0,
  -- Stats
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_type, card_ref_id)
);

CREATE INDEX idx_user_cards_user ON user_cards(user_id);
CREATE INDEX idx_user_cards_due ON user_cards(user_id, due);

CREATE TABLE review_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 4),
  response TEXT,
  was_correct BOOLEAN NOT NULL,
  time_taken_ms INT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_logs_user ON review_logs(user_id);
CREATE INDEX idx_review_logs_card ON review_logs(user_card_id);

--------------------------------------------------
-- ROW LEVEL SECURITY
--------------------------------------------------

-- Content tables: readable by all authenticated users
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "words_read" ON words FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE grammar_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grammar_read" ON grammar_topics FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_read" ON exercises FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE sentences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sentences_read" ON sentences FOR SELECT USING (auth.role() = 'authenticated');

-- User tables: users can only access their own data
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_cards_select" ON user_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_cards_insert" ON user_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_cards_update" ON user_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_cards_delete" ON user_cards FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_logs_select" ON review_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "review_logs_insert" ON review_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Seed Data Format

Seed data is stored as JSON files in `src/data/seed/` and pushed to Supabase via Python scripts.

### Words JSON format

```json
[
  {
    "danish": "bil",
    "english": "car",
    "part_of_speech": "noun",
    "gender": "en",
    "module_level": 2,
    "difficulty": 1,
    "tags": ["transport", "daily"],
    "inflections": {
      "definite": "bilen",
      "plural_indef": "biler",
      "plural_def": "bilerne"
    },
    "example_da": "Jeg kører min bil til arbejde.",
    "example_en": "I drive my car to work.",
    "source": "module2-vocabulary"
  }
]
```

### Grammar Topics JSON format

```json
[
  {
    "title": "Noun Gender (T-ord og N-ord)",
    "slug": "noun-gender",
    "module_level": 2,
    "category": "nouns",
    "explanation": "Danish nouns have two genders: common (en-words) and neuter (et-words). About 75% of nouns are en-words. Gender must be memorized for each noun, though some patterns exist.",
    "rules": [
      {
        "rule": "Use 'en' for common gender nouns and 'et' for neuter gender nouns",
        "example_da": "en bil, et hus",
        "example_en": "a car, a house"
      },
      {
        "rule": "Definite form: add -en/-et to the end of the noun",
        "example_da": "bilen, huset",
        "example_en": "the car, the house"
      }
    ],
    "tips": [
      "People and animals are almost always en-words",
      "Words ending in -hed, -else, -tion are en-words",
      "Countries and languages are usually et-words"
    ],
    "common_mistakes": [
      "Using 'et' with people nouns (wrong: 'et mand', correct: 'en mand')",
      "Forgetting that definite plural is always -ne/-erne regardless of gender"
    ],
    "sort_order": 1
  }
]
```

### Exercises JSON format

```json
[
  {
    "grammar_topic_slug": "noun-gender",
    "exercise_type": "type_answer",
    "question": "What is the definite form of 'en bil'?",
    "correct_answer": "bilen",
    "acceptable_answers": [],
    "hint": "Add the gender suffix to the end",
    "explanation": "en bil → bilen (add -en for common gender definite)",
    "module_level": 2,
    "difficulty": 1
  },
  {
    "grammar_topic_slug": "inverted-word-order",
    "exercise_type": "word_order",
    "question": "Put in correct order: [morgenmad / i morges / jeg / spiste]",
    "correct_answer": "I morges spiste jeg morgenmad",
    "acceptable_answers": ["I morges spiste jeg morgenmad."],
    "explanation": "When time expression comes first, verb-subject inversion occurs: I morges SPISTE JEG...",
    "module_level": 2,
    "difficulty": 2
  },
  {
    "grammar_topic_slug": "main-subordinate-clauses",
    "exercise_type": "cloze",
    "question": "Han spiser ikke morgenmad, fordi han ___ ___ sulten. (ikke / er)",
    "correct_answer": "ikke er",
    "acceptable_answers": [],
    "explanation": "In subordinate clauses (fordi...), the adverb (ikke) comes BEFORE the verb (er).",
    "module_level": 2,
    "difficulty": 2
  }
]
```

## Seed Script (Python)

```python
# scripts/seed-database.py
"""
Push seed JSON data to Supabase.
Usage: python scripts/seed-database.py
Requires: SUPABASE_URL and SUPABASE_SERVICE_KEY env vars
"""
import json
import os
from supabase import create_client

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_SERVICE_KEY"]  # Use SERVICE key for seeding (bypasses RLS)
supabase = create_client(url, key)

def seed_table(table: str, filepath: str):
    with open(filepath) as f:
        data = json.load(f)
    
    # For exercises, resolve grammar_topic_slug to grammar_topic_id
    if table == "exercises":
        topics = {t["slug"]: t["id"] for t in supabase.table("grammar_topics").select("id, slug").execute().data}
        for item in data:
            slug = item.pop("grammar_topic_slug", None)
            if slug:
                item["grammar_topic_id"] = topics.get(slug)
    
    # Batch insert
    batch_size = 100
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        supabase.table(table).insert(batch).execute()
    
    print(f"Seeded {len(data)} rows into {table}")

if __name__ == "__main__":
    seed_table("grammar_topics", "src/data/seed/grammar-module2.json")
    seed_table("words", "src/data/seed/words-module2.json")
    seed_table("exercises", "src/data/seed/exercises-module2.json")
    seed_table("sentences", "src/data/seed/sentences-module2.json")
    print("Done!")
```

## Key Rules

- Always use migrations for schema changes. Never manually alter tables.
- Seed data uses the SERVICE_KEY (admin), not the ANON_KEY.
- RLS is mandatory on all tables. Test that users cannot see other users' data.
- Content tables (words, grammar_topics, exercises, sentences) are read-only for users.
- User tables (user_cards, review_logs) are per-user via RLS.
- Inflections are stored as JSONB because the shape varies by part of speech.
- Every word, exercise, and sentence must have a module_level tag.
- Use slugs for grammar topics (URL-friendly, human-readable identifiers).
