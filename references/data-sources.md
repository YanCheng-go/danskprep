# Data Sources — DanskPrep

All external sources used to populate seed data, with scraping details and data status.

---

## 1. mit.speakspeak.dk

| Property | Value |
|----------|-------|
| URL | https://mit.speakspeak.dk |
| Platform | Moodle LMS |
| Auth | Microsoft SSO (username `64267`) |
| Scraper | `scripts/scrape-speakspeak.py` |
| Reference | `references/speakspeak.md` |
| Data type | H5P quiz exercises (cloze, multiple choice, drag-text, true/false) |
| Output | `src/data/seed/exercises-pd3m2.json` (34 scraped exercises) |
| Module target | PD3 Module 2 (course `3962FNB 3.2 2601`, course_id=6303) |

**What's scraped:** H5P Blanks, MultiChoice, DragText, TrueFalse, SingleChoiceSet exercises.

**What's NOT yet scraped:**
- Writing assignments (`assign` activity type) — open text, no single correct answer
- Audio/listening tasks — audio files + comprehension questions in separate format
- Video activities

**How to run:**
```bash
cd scripts
uv run python scrape-speakspeak.py --exam PD3M2 --cookies cookies.json
```

---

## 2. speakandlearn.dk

| Property | Value |
|----------|-------|
| URL | https://speakandlearn.dk |
| Auth | None (public pages) |
| Scraper | `scripts/scrape-speakandlearn.py` |
| Data type | Verb lists (irregular + common) |

### Pages scraped

| Page | URL | Data | Status |
|------|-----|------|--------|
| Irregular verbs | `/danish-irregular-verbs-common/` | ~80 verbs: Infinitiv, Nutid, Datid, Førnutid | ✅ Imported (63 new) |
| Common verbs | `/common-verbs-400-common-danish-verbs/` | ~400 verbs: English \| Danish | ✅ Imported (143 new, empty inflections) |

**Output:** `src/data/seed/words-pd3m2.json`

**Notes:**
- Irregular verbs have full conjugation data: present, past, perfect (with correct er/har auxiliary), imperative (auto-derived)
- Common verbs have no inflection data yet — run `enrich-vocabulary.py` to fill them in via Claude API
- Some translation mappings on the common-verbs page are imprecise (e.g., "answer → svigte" should be "to fail/let down") — verify before relying on these for exam content

**How to run:**
```bash
cd scripts

# Use embedded pre-scraped data (fast, no web request)
uv run python scrape-speakandlearn.py --yes

# Re-scrape live from web
uv run python scrape-speakandlearn.py --live --yes

# Irregular verbs only (with full conjugations)
uv run python scrape-speakandlearn.py --irregular-only --yes
```

---

## 3. Gyldendal Modultest

| Property | Value |
|----------|-------|
| URL | See `references/gyldendal-modultest.md` |
| Auth | Unknown — see reference file |
| Scraper | Not yet built |
| Data type | Module test exercises |

---

## 4. moduletest.dk (Planned)

| Property | Value |
|----------|-------|
| URL | https://moduletest.dk |
| Auth | Google SSO (user logs in with Google account) |
| Scraper | `scripts/scrape-moduletest.py` (not yet built) |
| Data type | Practice tests for Danish module exams |

**Login flow:** Google OAuth — use Playwright interactive mode:
```bash
cd scripts
uv run python scrape-moduletest.py --interactive --save-cookies cookies-moduletest.json
uv run python scrape-moduletest.py --cookies cookies-moduletest.json
```

---

## Vocabulary Database Status

| Source | Words added | POS | Inflections |
|--------|------------|-----|-------------|
| Manual (module2-core) | 71 | nouns, verbs, adjectives, adverbs, conjunctions | Full |
| speakandlearn.dk (irregular) | 63 | verb | Full (present/past/perfect/imperative) |
| speakandlearn.dk (common) | 143 | verb | Empty — run `enrich-vocabulary.py` |
| **Total** | **277** | | |

To fill in missing inflections for the 143 common verbs:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
cd scripts
uv run python enrich-vocabulary.py
```

---

---

## 5. Danish Grammar PDF (Archive.org)

| Property | Value |
|----------|-------|
| URL | `https://dn790008.ca.archive.org/0/items/DanishGrammar/Danish%20Grammar.pdf` |
| Auth | None (public) |
| Format | PDF — comprehensive Danish grammar reference book |
| Scraper | Not yet built — `scripts/scrape-grammar-pdf.py` (planned) |
| Data type | Grammar rules, examples, tables for all major topics |

**What's useful:**
- Covers all 6 Module 2 grammar topics in depth with authoritative examples
- Noun gender tables, verb conjugation patterns, pronoun paradigms
- Could directly enrich `src/data/seed/grammar-pd3m2.json` explanations and `rule_cards`
- Example sentences are original and can inspire new exercises

**TODO:**
- Build `scripts/scrape-grammar-pdf.py` using `pdfminer.six` or `pymupdf` to extract text by chapter
- Map chapters to the 6 grammar topic slugs (`noun-gender`, `verbs-tenses`, etc.)
- Use Claude API to re-format extracted text into the `grammar-pd3m2.json` schema:
  ```json
  {
    "topic_slug": "noun-gender",
    "rule_cards": [{ "title": "...", "explanation": "...", "examples": [...] }],
    "tips": ["..."],
    "common_mistakes": ["..."]
  }
  ```
- The existing grammar seed has only basic stubs — this PDF would fill it out properly

**How to run (once built):**
```bash
cd scripts
uv add pymupdf   # or pdfminer.six
uv run python scrape-grammar-pdf.py --pdf Danish\ Grammar.pdf --output grammar-enriched.json
# Review output, then merge into src/data/seed/grammar-pd3m2.json
```

---

## Seed File Locations

| File | Contents | Words/Exercises |
|------|----------|-----------------|
| `src/data/seed/words-pd3m2.json` | All vocabulary | 277 words |
| `src/data/seed/exercises-pd3m2.json` | All quiz exercises | 201 exercises |
| `src/data/seed/grammar-pd3m2.json` | Grammar topic explanations (stubs) | 6 topics |
| `src/data/seed/sentences-pd3m2.json` | Example sentences | — |
| `src/data/seed/_speakspeak_raw_pd3m2_20260301_192523.json` | Raw scraped SpeakSpeak data | 35 exercises |
