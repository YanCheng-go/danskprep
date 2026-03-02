---
name: scrape-gyldendal
description: Scrape Gyldendal modultest exercises into seed data
user-invocable: true
---

# Scrape Gyldendal Modultest

Scrape Danish module mock tests from modultest.ibog.gyldendal.dk (Gyldendal's official Nuxt.js/Typo3 SPA) and convert them into DanskPrep seed data.

## When to use this skill

Use when the user wants to:
- Pull in official Gyldendal mock tests as practice exercises
- Enrich a module's exercise bank with publisher-quality questions
- Add content from a new module (Module 3, 4, etc.)

## Prerequisites

```bash
cd scripts
uv sync
uv run playwright install chromium
```

Credentials in environment (never hardcode):
```
GYLDENDAL_USER=you@email.com
GYLDENDAL_PASS=yourpassword
```

## Running the Scraper

```bash
# PD3M2 (default output: src/data/seed/exercises-pd3m2.json)
GYLDENDAL_USER=you@email.com GYLDENDAL_PASS=secret \
  uv run python scrape-gyldendal.py --module 3

# Custom output path
uv run python scrape-gyldendal.py --module 3 \
  --output src/data/seed/exercises-pd3m2.json

# Dump all captured API calls for debugging
uv run python scrape-gyldendal.py --module 3 --dump-api
```

## How the Script Works

The site is a Nuxt.js SPA with a Typo3 `/api` backend. The scraper uses **two strategies in parallel**:

### Strategy 1 — API Interception (primary)
Playwright intercepts all network responses from `/api/*` and H5P content endpoints.

### Strategy 2 — DOM Scraping (fallback)
If API responses contain no parseable exercises, the scraper reads H5P iframe DOMs.

### Exercise Type Mapping
| Gyldendal / H5P type | DanskPrep type |
|----------------------|----------------|
| `multiple-choice`, `true-false` | `multiple_choice` |
| `fill-in-the-blanks`, `drag-the-words` | `cloze` |
| `drag-and-drop`, `word-ordering` | `word_order` |
| `short-answer`, `essay` | `type_answer` |

## After Scraping

1. Search the output JSON for `"REVIEW"` — these items need a correct answer added manually
2. The browser window stays visible — watch it to understand which pages were visited
3. Push to Supabase when ready: `cd scripts && uv run python seed-database.py`

## Legal Note

Only scrape content from accounts you own or have licensed access to. The scraped exercises are for personal study use only and should not be redistributed. The `source: "gyldendal"` field marks their origin.
