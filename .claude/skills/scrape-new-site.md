# Scrape New Site

Set up scraping for a new website or a new section of an existing site. This skill ensures consistent documentation, reference files, and scraper code across all data sources.

## When to use this skill

Use when the user wants to:
- Add a new website as a data source
- Scrape a new section or module from an existing site (e.g. Module 4 from SpeakSpeak)
- Understand the structure of a site before writing a scraper
- Diagnose why an existing scraper is yielding 0 results

---

## Checklist — always follow this order

### Step 1 — Check the reference folder first
Before writing any code, check `references/` for an existing reference file for this site.

```
references/
├── speakspeak.md          # mit.speakspeak.dk — Moodle + H5P
├── gyldendal-modultest.md # modultest.ibog.gyldendal.dk — Nuxt.js SPA
└── {new-site}.md          # ← create this for every new site
```

If a reference file exists, read it before proceeding. If it doesn't exist, **create it as the first step** (even as a placeholder).

### Step 2 — Understand the site structure

Before writing the scraper, answer these questions and document them in the reference file:

| Question | Where to look |
|----------|--------------|
| What platform/framework? | Page source, response headers, `X-Powered-By` |
| SPA or server-rendered? | Check if `<div id="app">` with no content = SPA |
| Auth method? | Login page: local, OAuth/SSO, API key, cookie |
| API endpoints? | Browser DevTools → Network → XHR/Fetch |
| Exercise data location? | JavaScript globals (`window.H5PIntegration`), API JSON, DOM |
| Module/section URL pattern? | Navigate through the site manually first |
| robots.txt allows scraping? | `https://site.com/robots.txt` |

Run with `--visible` first to watch the browser navigate:
```bash
uv run python scripts/scrape-{site}.py --module N --visible
```

### Step 3 — Create or update the reference file

Create `references/{site-slug}.md` with this structure:

```markdown
# {Site Name} — Scraping Reference

## Site Overview
| Property | Value |
|----------|-------|
| URL | https://... |
| Platform | (Moodle / Nuxt.js / WordPress / custom) |
| Auth | (SSO / email+password / cookie / public) |

## Module / Section Structure
(URL patterns, naming conventions, what maps to what exam level)

## Exercise Format
(Types found, how they're stored, extraction method)

## URL Structure
(Key paths and their meaning)

## Known Issues / Quirks
(Anything non-obvious the scraper must handle)

## Updating This File
(When to update, what to document)
```

### Step 4 — Write or update the scraper

All scrapers live in `scripts/` and follow these conventions:
- **Python 3.12+** — use `from __future__ import annotations` for compatibility
- **uv only** — never pip; dependencies go in `scripts/pyproject.toml`
- **Playwright** — for all JS-rendered sites (SPAs, H5P, OAuth)
- **`--interactive` flag** — always support manual login for SSO sites
- **`--cookies` flag** — load saved session to skip login on repeat runs
- **`--save-cookies`** — save session after interactive login
- **`--visible`** — show browser for debugging
- **`--all-courses` or `--all-sections`** — scrape everything regardless of module filter
- **Debug dump** — always save raw scraped data to `src/data/seed/_*_raw_*.json`

Auth priority (in order):
1. `--cookies cookies.json` (fastest, requires prior `--interactive` run)
2. `--interactive` (opens browser, user logs in manually — required for SSO)
3. `SITE_USER` + `SITE_PASS` env vars (only if site uses simple form auth)

### Step 5 — Map to seed format

Every exercise must be mapped to this format before writing to `src/data/seed/exercises-module{N}.json`:

```json
{
  "grammar_topic_slug": "noun-gender",
  "exercise_type": "multiple_choice",
  "question": "...",
  "correct_answer": "...",
  "alternatives": ["...", "..."],
  "hint": null,
  "explanation": "Scraped from {SiteName}: {activity name}",
  "module_level": 2,
  "difficulty": 1,
  "source": "{site-slug}"
}
```

Grammar topic slugs: `noun-gender`, `comparative-superlative`, `inverted-word-order`, `main-subordinate-clauses`, `verbs-tenses`, `pronouns`

Exercise types: `type_answer`, `cloze`, `multiple_choice`, `word_order`, `error_correction`, `matching`, `conjugation`

### Step 6 — Post-scrape review

1. Search output JSON for `"REVIEW"` — these items have undetected correct answers; fix manually
2. Check `grammar_topic_slug` assignments — heuristics are good but not perfect
3. Update the reference file with any new findings
4. Run `python scripts/seed-database.py` to push to Supabase

---

## Adding a New Module to an Existing Scraper

When the user moves to a new exam level (e.g., Module 3 → Module 4):

1. Check `references/{site}.md` for module naming conventions
2. Add the new module's URL pattern or course name to the scraper's `find_courses()` or `navigate_to_module()` function
3. Update `TOPIC_KEYWORDS` in the scraper if Module 4+ introduces new grammar topics not covered by the current keyword list
4. Run the scraper with the new `--module N` flag
5. Update the reference file with the new module's structure

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| 0 exercises scraped, login succeeded | Wrong CSS selectors for this site's exercise format | Add `--visible`, take screenshot, update selectors |
| Login rejected | Wrong credentials or SSO-only account | Use `--interactive` |
| Cookies expired | Session timeout (usually 24h) | Re-run with `--interactive --save-cookies` |
| Site is SPA, no content in DOM | JavaScript hasn't rendered yet | Add `page.wait_for_timeout(3000)` after navigation |
| H5P exercises found but empty | `H5P_TYPE_MAP` missing the library name | Print `library` field, add mapping |
| API calls intercepted but no exercises | API uses a different JSON schema | Inspect `_*_raw_*.json` debug dump |
