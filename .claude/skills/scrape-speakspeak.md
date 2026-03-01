# Scrape SpeakSpeak

Scrape Danish language assignments from the user's personal SpeakSpeak Moodle account (mit.speakspeak.dk) and convert them into DanskPrep seed data.

## When to use this skill

Use when the user wants to:
- Pull in their completed Moodle assignments as practice exercises
- Enrich a module's exercise bank with real exam-style questions
- Add content from a new module (e.g. Module 3, 4) from SpeakSpeak

## Prerequisites

```bash
cd scripts
uv sync
uv run playwright install chromium
```

Auth: Microsoft SSO only — no username/password env vars needed. Use `--interactive` for first run.

## Running the Scraper

```bash
# First run — interactive login, saves cookies
uv run python scrape-speakspeak.py --exam PD3M2 --interactive --save-cookies cookies.json

# Subsequent runs — use saved cookies
uv run python scrape-speakspeak.py --exam PD3M2 --cookies cookies.json

# PD2 content
uv run python scrape-speakspeak.py --exam PD2 --cookies cookies.json

# Custom output path
uv run python scrape-speakspeak.py --exam PD3M2 --output src/data/seed/exercises-pd3m2.json

# Visible browser (for debugging)
uv run python scrape-speakspeak.py --exam PD3M2 --visible --cookies cookies.json
```

## What the Script Does

1. **Logs into** `mit.speakspeak.dk` with the provided credentials
2. **Finds courses** matching the module number on the Moodle dashboard and catalogue
3. **Scrapes activities** — quizzes, assignments, lessons, H5P exercises
4. **Parses each question** using Moodle's `.que` element structure, detecting:
   - `multichoice` → `multiple_choice`
   - `shortanswer` → `type_answer`
   - `match` → `matching`
   - `gapselect` / `ddwtos` → `cloze` / `word_order`
5. **Detects grammar topic** from question text using keyword heuristics
6. **Merges into existing seed JSON** — no duplicates (keyed by question + answer)
7. **Saves a debug dump** alongside the seed file for manual review

## Output Format

Each exercise is added to `src/data/seed/exercises-module{N}.json` in this shape:
```json
{
  "grammar_topic_slug": "noun-gender",
  "exercise_type": "multiple_choice",
  "question": "Hvad er 'bil' — en-ord eller et-ord?",
  "correct_answer": "en-ord",
  "alternatives": ["et-ord"],
  "hint": null,
  "explanation": "Scraped from SpeakSpeak: Modul 2 grammatik",
  "module_level": 2,
  "difficulty": 1,
  "source": "speakspeak"
}
```

## After Scraping

1. Open the output JSON and search for `"REVIEW"` — these are items where the correct answer could not be auto-detected; fix them manually
2. Review grammar topic assignments — the heuristic is good but not perfect; adjust `grammar_topic_slug` where needed
3. Run the seed script to push to Supabase: `python scripts/seed-database.py`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "No courses found" | Run with `--visible` and check what courses appear on the Moodle dashboard |
| "Login failed" | Verify credentials; try logging in manually first |
| 0 exercises scraped | Course may use H5P embeds — visible browser will show them; DOM fallback handles basic H5P |
| Questions missing correct answers | SpeakSpeak may hide answers until after submission; complete the assignment first |

## Extending for New Modules

The script is module-agnostic — just change `--module N`. The grammar topic detection in `TOPIC_KEYWORDS` may need updating when adding Module 3+ topics. Add new keyword→slug pairs at the top of `scrape-speakspeak.py`.
