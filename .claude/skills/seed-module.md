# Seed Module

Prepare or update the complete seed data package for a Danish exam module: words, grammar topics, exercises, and sentences.

## Instructions

The user specifies a module level (1–5). Follow this pipeline:

### Step 1 — Grammar Topics (`src/data/seed/grammar-module{N}.json`)

For each of the 6 core Module 2 topics (or equivalent for other modules), produce a `grammar_topics` entry. Use the JSON format defined in `database-schema.md`. Each topic must include: `title`, `slug`, `module_level`, `category`, `explanation` (100–300 words in English), `rules` array (with `rule`, `example_da`, `example_en`), `tips`, `common_mistakes`, `sort_order`.

### Step 2 — Words (`src/data/seed/words-module{N}.json`)

Produce ~300 words. Include:
- At least 100 nouns (mix of en/et gender)
- At least 80 verbs (mix of regular groups + 10 irregular)
- At least 40 adjectives
- All common pronouns, conjunctions, and prepositions for the module

### Step 3 — Exercises (`src/data/seed/exercises-module{N}.json`)

Produce ~200 exercises distributed across:
- 30% cloze
- 25% type_answer
- 20% multiple_choice
- 15% word_order
- 10% error_correction

Each grammar topic should have at least 10 exercises.

### Step 4 — Sentences (`src/data/seed/sentences-module{N}.json`)

Produce ~100 sentence pairs. Use the sentences JSON format from `database-schema.md`. Each sentence needs `danish`, `english`, `module_level`, `topic_tags` array, `difficulty` (1–3), `source: "generated"`.

### Delivery

Output each JSON file separately. Validate that all strings use UTF-8 Danish characters (æ, ø, å) correctly. After generation, suggest running `scripts/seed-database.py` to push to Supabase.
