---
name: scrape-speakspeak
description: Scrape SpeakSpeak Moodle assignments into seed data
user-invocable: true
---

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

# Visible browser (for debugging)
uv run python scrape-speakspeak.py --exam PD3M2 --visible --cookies cookies.json
```

## What the Script Does

1. **Logs into** `mit.speakspeak.dk` with the provided credentials
2. **Finds courses** matching the module number on the Moodle dashboard and catalogue
3. **Scrapes activities** — quizzes, assignments, lessons, H5P exercises
4. **Parses each question** using Moodle's `.que` element structure
5. **Detects grammar topic** from question text using keyword heuristics
6. **Merges into existing seed JSON** — no duplicates (keyed by question + answer)

## After Scraping

1. Open the output JSON and search for `"REVIEW"` — fix items where the correct answer could not be auto-detected
2. Review grammar topic assignments — the heuristic is good but not perfect
3. Push to Supabase when ready: `cd scripts && uv run python seed-database.py`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "No courses found" | Run with `--visible` and check what courses appear on the Moodle dashboard |
| "Login failed" | Verify credentials; try logging in manually first |
| 0 exercises scraped | Course may use H5P embeds — visible browser will show them |
| Questions missing correct answers | Complete the assignment first — SpeakSpeak may hide answers until after submission |
