# Data Pipeline: SpeakSpeak to DanskPrep

How exercise and vocabulary data flows from the SpeakSpeak Moodle course into the DanskPrep web app.

## Overview

```
mit.speakspeak.dk (Moodle LMS)
        │
        ▼ scrape-speakspeak-full.py (Playwright + cookies)
        │
  Raw course dump (JSON)
        │
        ▼ process-full-dump.py --extract-only
        │
  ├── Extracted exercises (H5P blanks, MC, drag-text)
  └── Text segments (teacher notes, assignments, pages)
        │
        ├──▶ Content-generator agents (Claude Code)
        │         │
        │         ▼
        │    Clean seed exercises (cloze, type_answer, MC, word_order, error_correction)
        │
        └──▶ Vocabulary extraction + enrichment (Claude Code)
                  │
                  ▼
             Enriched vocabulary (base forms, english, POS, inflections)
        │
        ▼ Merge into seed JSON files
        │
  src/data/seed/exercises-pd3m2.json
  src/data/seed/words-pd3m2.json
        │
        ▼ Supabase migration (seed script)
        │
  Production database (exercises, words tables)
        │
        ▼ React app loads from Supabase / local JSON
        │
  User sees exercises in quiz, vocabulary in dictionary
```

## Source

- **Course:** 3962FNB 3.2 2601 (PD3 Module 2) on [mit.speakspeak.dk](https://mit.speakspeak.dk)
- **Platform:** Moodle LMS with H5P interactive content
- **Auth:** Microsoft SSO (manual login required, cookies saved for ~24h)
- **Content:** 17 sections, 94 activities (49 H5P exercises, 22 pages, 6 assignments, 9 URLs, 4 resources, misc)

## Pipeline Scripts

All scripts are in `scripts/`. Run with `uv run python <script>.py`.

### Step 1: Scrape the course

```bash
cd scripts

# First time: interactive login (opens browser for Microsoft SSO)
uv run python scrape-speakspeak-full.py --exam PD3M2 --interactive --save-cookies

# Subsequent runs: reuse cookies (~24h expiry)
uv run python scrape-speakspeak-full.py --exam PD3M2 --cookies cookies.json
```

**Output:** `data/speakspeak-full-pd3m2_YYYYMMDD_HHMMSS.json` (~3 MB)

This visits all 94 course activities and saves:

| Module type | Count | What's captured |
|------------|-------|-----------------|
| hvp (H5P) | 49 | Full `window.H5PIntegration` JSON with all answers |
| page | 22 | HTML + plain text (teacher board notes, reading texts) |
| assign | 6 | Assignment instructions (writing tasks) |
| url | 9 | External link targets |
| resource | 4 | Downloaded files (PDFs, verb lists) → `data/files/` |
| folder | 1 | File listing + downloads |
| quiz/forum/label | 3 | Page content |

### Step 2: Extract exercises and text

```bash
uv run python process-full-dump.py data/speakspeak-full-pd3m2_*.json --extract-only
```

**Output:**
- `data/dump-exercises-YYYYMMDD_HHMMSS.json` — extracted exercises
- `data/dump-text-YYYYMMDD_HHMMSS.json` — text segments

H5P exercise extraction by library type:

| H5P Type | Exercise type | How answers are extracted |
|----------|--------------|--------------------------|
| Blanks | cloze | `*answer*` markers in text field. Multi-blank: each blank becomes a separate exercise with other blanks filled in. |
| DragText | cloze | Same `*answer*` pattern. Per-blank question generation. |
| SingleChoiceSet | multiple_choice | `answers[0]` is always correct. |
| MultiChoice | multiple_choice | Option with `correct: true` flag. |
| QuestionSet | (recurse) | Sub-questions parsed by their own library type. |
| MarkTheWords | error_correction | Words marked with `*asterisks*` are the targets. |

### Step 3: Generate clean exercises

This step uses Claude Code content-generator agents (no API key needed — runs in Claude Code directly).

The dump exercises are grouped by source URL (one H5P activity = one group). Each group is sent to an agent with the full context (activity title + all blanks/answers). The agent generates clean standalone exercises with:

- Correct `grammar_topic_slug` inferred from the activity title
- Mixed exercise types (cloze, type_answer, multiple_choice, word_order, error_correction)
- English hints and explanations
- Difficulty levels (1-3)

**Output:** `data/generated-all-merged.json`

### Step 4: Extract and enrich vocabulary

1. **Extract:** Tokenize all exercise answers + text segments, count occurrences
2. **Filter:** Remove meta-words (grammatik, tavlenoter, etc.), names, places, stop words
3. **Enrich** (via Claude Code agents): For each candidate word:
   - Convert inflected forms to base/dictionary form (lægen → læge)
   - Classify part of speech (verb/noun/adjective only)
   - Add English translation
   - Add inflection forms (present/past/perfect for verbs, definite/plural for nouns, etc.)
   - Add example sentence

**Output:** `data/enriched-all-merged.json`

### Step 5: Verify exercises

Review generated exercises for correctness:
- Is the Danish answer correct?
- Is the question clear and unambiguous?
- For cloze: does the blank have exactly one correct answer?
- For multiple_choice: are alternatives plausible but wrong?

### Step 6: Merge into seed files

Final deduplication against existing seed data, then merge:
- `src/data/seed/exercises-pd3m2.json`
- `src/data/seed/words-pd3m2.json`

### Step 7: Push to Supabase

Run `/supabase-sync` to push updated seed data to the production database.

## Grammar Topics

Exercises are tagged with one of these `grammar_topic_slug` values:

| Slug | What it covers | SpeakSpeak activities |
|------|---------------|----------------------|
| `noun-gender` | en/et, definite/indefinite/plural | Bestemt/ubestemt, Substantiver |
| `comparative-superlative` | Adjective degrees | Adjektiverne 1 & 2 |
| `inverted-word-order` | V2 rule, adverb+verb inversion | Inversion 1 & 2 |
| `main-subordinate-clauses` | Subordinate clause word order, conjunctions | Ledsætninger (at/når/hvis/da), Hovedsætningskonjunktioner, Centraladverbiet, hv-ord |
| `verbs-tenses` | All tenses + imperativ + s-passiv | Datid, Imperativ, s-passiv, Nutid til datid, Førdatid |
| `pronouns` | Personal/possessive/reflexive/relative | Hans/hendes/sin/sit, der/som |

## Data Sources Summary

| Source | Exercises | Words | Method |
|--------|-----------|-------|--------|
| SpeakSpeak H5P (this pipeline) | ~513 | ~150-200 | Scrape → extract → generate |
| SpeakSpeak (old scraper, LLM-rewritten) | 125 | — | `scrape-speakspeak.py` → `analyze-speakspeak.py` |
| Board notes (tavlenoter) | 59 | 31 | Manual extraction from class notes |
| Generated (LLM, no source) | 100 | — | `analyze-speakspeak.py` |
| speakandlearn.dk | — | 206 | `scrape-speakandlearn.py` |
| Module 2 core | — | 71 | Manual curation |
| Extracted from exercises | — | 99 | Automated extraction |

## File Inventory

### Keep (source of truth)
- `data/speakspeak-full-pd3m2_*.json` — raw course dump
- `data/dump-exercises-*_015941.json` — latest extracted exercises
- `data/dump-text-*_015941.json` — latest text segments
- `data/generated-all-merged.json` — final generated exercises
- `data/enriched-all-merged.json` — final enriched vocabulary
- `data/files/` — downloaded course files (PDFs, verb lists)

### Can remove (intermediate/superseded)
- `data/dump-exercises-*_012559.json` — older extraction (before per-blank fix)
- `data/dump-text-*_012559.json` — older extraction
- `data/dump-vocabulary-*.json` — unused/empty
- `data/seed-exercises-converted.json` — superseded by generated batches
- `data/seed-vocabulary-extracted.json` — superseded by filtered version
- `data/vocab-*.json` — intermediate vocabulary files
- `data/generated-batch-*.json` — superseded by merged file
- `data/enriched-batch-*.json` — superseded by merged file
- `data/_debug_*` — debug files
