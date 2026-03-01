# SpeakSpeak (mit.speakspeak.dk) — Scraping Reference

## Site Overview

| Property | Value |
|----------|-------|
| URL | https://mit.speakspeak.dk |
| Platform | Moodle LMS (open-source) |
| Auth | Microsoft SSO — local Moodle login does NOT work |
| Username | `64267` (numeric student ID) |
| Login flow | Click "Log in with Microsoft" → SSO → lands on `/my/` dashboard |
| Session | Saved to `scripts/cookies.json` after `--interactive --save-cookies` |

---

## Course Naming Convention

Courses are named by the school's internal class code system:

```
{class_id}  {term_code}  modul {X.Y}
   3962FNB    2508           3.1
```

| Part | Meaning | Example |
|------|---------|---------|
| `3962FNB` | Class/group ID assigned by the school | `3962FNB` |
| `2508` | Term start (YYMM or DDHH) — approximate | `2508` = August 2025 |
| `modul 3.1` | **Module number** — see mapping below | `3.1` |

### Module Number Mapping

| Course suffix | Official exam level | Scraper `--exam` flag | Output file |
|---------------|---------------------|-----------------------|-------------|
| `modul 2` | Prøve i Dansk 2 (PD2) | `--exam PD2` | `exercises-pd2.json` |
| `modul 3.1` | PD3 Module 1 | `--exam PD3M1` | `exercises-pd3m1.json` |
| `modul 3.2` | **PD3 Module 2** | `--exam PD3M2` ← **primary target** | `exercises-pd3m2.json` |

> **Current user's enrolled courses:**
> - `3962FNB 2508 modul 3.1` → **PD3 Module 1** (`course_id=5971`)
> - `3962FNB 3.2 2601` → **PD3 Module 2** (`course_id=6303`) ← primary scraping target

### Scraper CLI — `--exam` flag (preferred)

```bash
# Scrape PD3 Module 2 content (modul 3.2) — primary target
uv run python scrape-speakspeak.py --exam PD3M2 --cookies cookies.json

# Scrape PD3 Module 1 content (modul 3.1)
uv run python scrape-speakspeak.py --exam PD3M1 --cookies cookies.json

# Scrape PD2 exam content (modul 2)
uv run python scrape-speakspeak.py --exam PD2 --cookies cookies.json

# First run / cookie refresh — interactive login
uv run python scrape-speakspeak.py --exam PD3M2 --interactive --save-cookies cookies.json

# Scrape everything (all enrolled courses)
uv run python scrape-speakspeak.py --all-courses --cookies cookies.json
```

---

## Activity Structure

Each course contains two activity types:

### H5P Activities (`/mod/hvp/`)
- **~79 per course** — the majority of interactive exercises
- Rendered inside an iframe via `H5PIntegration` JavaScript object
- Data extracted from `window.H5PIntegration.contents[cid].jsonContent`
- Common H5P types found:
  | H5P library | DanskPrep type | Example |
  |------------|----------------|---------|
  | `H5P.MultiChoice` | `multiple_choice` | Pick the correct article |
  | `H5P.Blanks` | `cloze` | Fill in the verb form |
  | `H5P.DragText` | `cloze` | Drag words into blanks |
  | `H5P.TrueFalse` | `multiple_choice` | Is this word order correct? |
  | `H5P.SingleChoiceSet` | `multiple_choice` | Series of one-answer questions |

### Standard Moodle Quizzes (`/mod/quiz/`)
- **~6 per course** — listening comprehension + grammar drills
- Parsed via `.que` DOM elements
- Question types: `multichoice`, `shortanswer`, `gapselect`

### Non-interactive Activities (skipped by scraper)
- `/mod/resource/` — PDF files, slides
- `/mod/url/` — external links
- `/mod/page/` — text/HTML pages
- `/mod/folder/` — file folders

---

## URL Structure

```
Dashboard:        /my/
Enrolled courses: /my/courses.php
Course view:      /course/view.php?id={course_id}
H5P activity:     /mod/hvp/view.php?id={activity_id}
Quiz:             /mod/quiz/view.php?id={activity_id}
Quiz attempt:     /mod/quiz/attempt.php?attempt={attempt_id}&cmid={activity_id}
```

---

## Cookie Refresh Procedure

Cookies expire after a Moodle session timeout (typically 24h). To refresh:

```bash
cd scripts
uv run python scrape-speakspeak.py --exam PD3M2 --interactive --save-cookies cookies.json
```

The browser opens. Log in via Microsoft SSO, then the scraper saves new cookies and continues automatically.

---

## Known Issues / Quirks

- Activity names appear empty on the course page (icons only in Moodle's responsive theme). The scraper gets the name from `page.title()` when visiting the activity.
- H5P `QuestionSet` wraps multiple sub-questions — the scraper recurses into nested `questions[]` arrays.
- Some H5P activities are audio-based (listening exercises) — these will scrape question text but the audio won't be captured. Mark those as `REVIEW` manually.
- Moodle's guest/unauthenticated view shows a "Microsoft" login link on `/course/index.php` — don't confuse this with a course.

---

## Updating This File

Update this file whenever:
- A new class/term starts (new course IDs)
- New H5P activity types are encountered that aren't in `H5P_TYPE_MAP`
- The module→exam level mapping changes
- Login procedure changes (new SSO flow, new username format)
