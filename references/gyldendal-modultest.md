# Gyldendal Modultest (modultest.ibog.gyldendal.dk) — Scraping Reference

> **Status: PLACEHOLDER — fill in after first successful scrape.**
>
> Run the scraper with `--visible` and observe the browser, then document the structure below.

---

## Site Overview

| Property | Value |
|----------|-------|
| URL | https://modultest.ibog.gyldendal.dk |
| Platform | Nuxt.js SPA + Typo3 CMS backend |
| API base | `/api` |
| Auth | Unknown — likely email/password or institution SSO |
| Publisher | Gyldendal (major Danish educational publisher) |
| Purpose | Official mock tests aligned with Prøve i Dansk exam levels |

---

## Login

> **TODO**: Document login flow after first interactive run.

Suspected login options:
- [ ] Email + password (Gyldendal account)
- [ ] Institution SSO (UNI•Login or similar)
- [ ] Access code (per-book licence)

```bash
# First run — log in manually
cd scripts
GYLDENDAL_USER=you@email.com GYLDENDAL_PASS=secret \
  uv run python scrape-gyldendal.py --module 2 --visible

# Or interactive mode
uv run python scrape-gyldendal.py --module 2 --interactive --save-cookies gyldendal_cookies.json
```

---

## Module Structure

> **TODO**: Fill in after exploring the site.

Suspected URL pattern based on Nuxt.js config (`da` locale prefix):

```
Home:        /da/
Module 1:    /da/modul-1   (?)
Module 2:    /da/modul-2   (?)
Module 3:    /da/modul-3   (?)
```

| URL path | Exam level | Notes |
|----------|------------|-------|
| `/da/modul-1` | Prøve i Dansk 1 | TODO: verify |
| `/da/modul-2` | Prøve i Dansk 2 | TODO: verify — **primary target for MVP** |
| `/da/modul-3` | Prøve i Dansk 3 | TODO: verify |

---

## Exercise Format

> **TODO**: Document after first scrape. The scraper uses two strategies:
>
> 1. **API interception** — capture `/api/*` JSON responses containing exercise data
> 2. **DOM fallback** — read H5P iframe DOMs

Suspected exercise types based on Gyldendal's published materials:
- [ ] Multiple choice
- [ ] Fill-in-the-blank (cloze)
- [ ] Word order
- [ ] Reading comprehension
- [ ] Listening (audio-based)

---

## Known Issues

> **TODO**: Document after first scrape.

- The site uses fingerprinting on the front page — the scraper handles the "Click here to enter" redirect automatically
- As a Nuxt.js SPA, all content is rendered client-side via JavaScript; standard HTTP scraping does not work
- API responses may require authentication headers — check captured payloads in `_gyldendal_debug_*.json`

---

## How to Fill in This Document

After running the scraper for the first time with `--visible`:

1. Watch the browser navigate through the site
2. Open browser DevTools → Network tab → filter by `api` to see API calls
3. Note the URL structure of test pages
4. Check `src/data/seed/_gyldendal_debug_*.json` for captured API payloads
5. Update all `TODO` sections in this file
6. Add entries to `H5P_TYPE_MAP` or `GYLDENDAL_TYPE_MAP` in `scrape-gyldendal.py` for any new exercise types

---

## Updating This File

Update this file whenever:
- The site structure or login method changes
- New exercise types are found
- Module URL patterns are confirmed or change
- New exam levels become available
