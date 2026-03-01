# Scrape Gyldendal Modultest

Scrape Danish module mock tests from modultest.ibog.gyldendal.dk (Gyldendal's official Nuxt.js/Typo3 SPA) and convert them into DanskPrep seed data.

## When to use this skill

Use when the user wants to:
- Pull in official Gyldendal mock tests as practice exercises
- Enrich a module's exercise bank with publisher-quality questions
- Add content from a new module (Module 3, 4, etc.)

## Prerequisites

```bash
pip install playwright
playwright install chromium
```

Credentials in environment (never hardcode):
```
GYLDENDAL_USER=you@email.com
GYLDENDAL_PASS=yourpassword
```

## Running the Scraper

```bash
# Module 2 (default output: src/data/seed/exercises-module2.json)
GYLDENDAL_USER=you@email.com GYLDENDAL_PASS=secret \
  python scripts/scrape-gyldendal.py --module 2

# Module 3
GYLDENDAL_USER=you@email.com GYLDENDAL_PASS=secret \
  python scripts/scrape-gyldendal.py --module 3

# Custom output path
python scripts/scrape-gyldendal.py --module 2 \
  --output src/data/seed/exercises-module2.json

# Dump all captured API calls for debugging
python scripts/scrape-gyldendal.py --module 2 --dump-api
```

## How the Script Works

The site is a Nuxt.js SPA with a Typo3 `/api` backend. Standard HTTP scraping won't work. The scraper uses **two strategies in parallel**:

### Strategy 1 — API Interception (primary)
Playwright intercepts all network responses from `/api/*` and H5P content endpoints. These are already structured JSON, so the scraper parses them directly without touching the DOM. This captures:
- Exercise definitions
- Correct answers and distractors
- Feedback text (used as explanations)

### Strategy 2 — DOM Scraping (fallback)
If API responses contain no parseable exercises (e.g. all content is in iframes), the scraper reads H5P iframe DOMs for question text.

### Exercise Type Mapping
| Gyldendal / H5P type | DanskPrep type |
|----------------------|----------------|
| `multiple-choice`, `true-false` | `multiple_choice` |
| `fill-in-the-blanks`, `drag-the-words` | `cloze` |
| `drag-and-drop`, `word-ordering` | `word_order` |
| `short-answer`, `essay` | `type_answer` |

## Output Format

Each exercise is merged into `src/data/seed/exercises-module{N}.json`:
```json
{
  "grammar_topic_slug": "inverted-word-order",
  "exercise_type": "word_order",
  "question": "Put in correct order: dansk / i Danmark / man / taler",
  "correct_answer": "I Danmark taler man dansk",
  "alternatives": null,
  "hint": null,
  "explanation": "Scraped from Gyldendal modultest (module 2)",
  "module_level": 2,
  "difficulty": 2,
  "source": "gyldendal"
}
```

## After Scraping

1. Search the output JSON for `"REVIEW"` — these items need a correct answer added manually
2. The browser window stays visible — watch it to understand which pages were visited
3. Check `_gyldendal_debug_*.json` in the seed folder for the full raw output before deduplication
4. Push to Supabase when ready: `python scripts/seed-database.py`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "No URLs found for Module N" | The URL slug may differ — watch the browser, find the correct URL, and add it to `navigate_to_module()` in the script |
| Login not working | The login form selector may have changed; run and inspect the browser window |
| 0 exercises from API | Gyldendal may have changed their API structure; check `_gyldendal_debug_*.json` for captured payloads |
| H5P exercises not parsing | H5P content is sandboxed; the scraper accesses iframe DOMs — may need `page.wait_for_timeout()` increase |
| Site fingerprinting redirect | The scraper handles the "Click here to enter" redirect automatically |

## Extending for New Modules

Just change `--module N`. If Module 3+ uses different URL slugs (e.g. `/da/avanceret-modul-3`), update `navigate_to_module()` in `scrape-gyldendal.py`. The grammar topic keyword list (`TOPIC_KEYWORDS`) should be extended when new module topics are added to the app.

## Legal Note

Only scrape content from accounts you own or have licensed access to. The scraped exercises are for personal study use only and should not be redistributed. The `source: "gyldendal"` field in each exercise marks their origin.
