---
name: backlog
description: Manage the project backlog — add, list, filter, update, prioritize, and suggest work items
user-invocable: true
---

# /backlog — Project Backlog Manager

## When to use

Use this skill to manage `docs/backlog.md` as the structured project planning system. It replaces freeform NOTES.md checkboxes with metadata-rich items that can be filtered, prioritized, and tracked through their lifecycle.

## Subcommand dispatch

Parse the user's arguments to determine which subcommand to run:

| Invocation | Action |
|---|---|
| `/backlog` (no args) | **Dashboard** — show status counts + top 5 ready items |
| `/backlog add <text>` | **Add** — parse prompt, auto-assign metadata, confirm, write |
| `/backlog list [--status=X] [--area=X] [--priority=X]` | **List** — show filtered summary table |
| `/backlog view BL-NNN` | **View** — show full detail + dependency status |
| `/backlog update BL-NNN field=value [...]` | **Update** — modify metadata fields |
| `/backlog done BL-NNN` | **Done** — mark completed with timestamp |
| `/backlog drop BL-NNN [reason]` | **Drop** — mark dropped, warn about dependents |
| `/backlog next` | **Next** — recommend highest-priority unblocked item |
| `/backlog prioritize` | **Prioritize** — interactive review of ready/idea items |
| `/backlog import` | **Import** — one-time migration from NOTES.md |

---

## Metadata schema

Every backlog item has these fields:

| Field | Allowed values |
|-------|---------------|
| **id** | `BL-001` through `BL-999` (auto-incrementing, zero-padded) |
| **title** | Short imperative summary, max 50 chars in table |
| **type** | `feature` / `bug` / `content` / `infra` / `chore` |
| **area** | `quiz` / `vocabulary` / `grammar` / `srs` / `ui` / `scraping` / `db` / `auth` / `analytics` / `dx` |
| **priority** | `p0` (critical) / `p1` (high) / `p2` (medium) / `p3` (low) |
| **effort** | `xs` / `s` / `m` / `l` / `xl` |
| **status** | `idea` / `ready` / `in-progress` / `done` / `dropped` |
| **scope** | `PD2` / `PD3M1` / `PD3M2` / `all` / `—` |
| **dependencies** | Comma-separated `BL-NNN` IDs, or `—` for none |
| **created** | `YYYY-MM-DD` |

---

## File format

`docs/backlog.md` has three sections:

1. **Header line** — `> Last updated: YYYY-MM-DD | Total: N | Ready: N | In Progress: N`
2. **Summary table** — one row per item, scannable overview
3. **Items section** — full detail blocks with description + notes

### Item detail template

```markdown
### BL-NNN: Short imperative title

- **Type:** feature | **Area:** quiz | **Priority:** p2 | **Effort:** m
- **Status:** ready | **Scope:** PD3M2
- **Created:** 2026-03-02
- **Dependencies:** none

Description paragraph with context and acceptance criteria.

#### Notes

_Status changes and session notes appended here._

---
```

---

## Subcommand instructions

### `/backlog` (dashboard)

1. Read `docs/backlog.md`
2. Count items by status: idea, ready, in-progress, done, dropped
3. List all `in-progress` items first
4. List top 5 `ready` items sorted by priority (p0 first), then effort (xs first for quick wins)
5. Show any blocked items (dependencies not all `done`)
6. Output as a formatted summary to the user — **do NOT modify the file**

### `/backlog add <description>`

1. Read `docs/backlog.md` to determine the next ID (find highest `BL-NNN`, increment by 1)
2. Apply **auto-assignment heuristics** (see below) to the user's description
3. Present the proposed item for confirmation:
   ```
   BL-012: Fix mobile quiz layout cutting off on iPhone SE
   Type: bug | Area: ui | Pri: p1 | Effort: s | Scope: all | Status: ready

   Description: [expanded from prompt]

   Confirm? (or override any field)
   ```
4. On confirmation, write the updated file: add a table row + a detail section
5. Update header line counts

### `/backlog list [filters]`

1. Read `docs/backlog.md`, parse the summary table
2. Apply filters — if none given, show all items except `done` and `dropped`
3. Multiple filters combine with AND logic
4. Output the filtered table — **do NOT modify the file**

### `/backlog view BL-NNN`

1. Read `docs/backlog.md`, find the detail section for the ID
2. Output the full detail section including Notes
3. If the item has dependencies, also show each dependency's current status

### `/backlog update BL-NNN field=value [field=value ...]`

1. Read `docs/backlog.md`
2. Validate field names and values against the schema
3. Update both the summary table row AND the detail section metadata
4. If changing status, append a timestamped note: `- YYYY-MM-DD: Status changed from X to Y`
5. Write the complete file and update header counts

### `/backlog done BL-NNN`

1. Set status to `done`
2. Append note: `- YYYY-MM-DD: Completed`
3. Check if completing this item unblocks other items — if so, tell the user

### `/backlog drop BL-NNN [reason]`

1. Set status to `dropped`
2. Append note: `- YYYY-MM-DD: Dropped — <reason or "no reason given">`
3. Check if dropping this item blocks other items — if so, warn the user

### `/backlog next`

1. Filter to `status=ready` items where all dependencies are `done` (or have no deps)
2. Score each item:
   - Priority: p0=40, p1=30, p2=20, p3=10
   - Effort bonus (prefer quick wins): xs=10, s=8, m=5, l=2, xl=0
   - Context bonus: +5 if area matches files changed recently (`git diff --stat HEAD~5`)
3. Present the top recommendation with reasoning
4. Also list the next 2–3 alternatives

### `/backlog prioritize`

1. Show all `ready` and `idea` items grouped by current priority
2. Ask the user which items should be promoted, demoted, or dropped
3. Apply changes as a batch update
4. This is interactive — may take multiple turns

### `/backlog import`

One-time migration from `NOTES.md`. See the **Import procedure** section below.

---

## Auto-assignment heuristics

When the user provides a natural language description, infer metadata using these rules. If multiple signals conflict, prefer the more specific one. Always present results for user confirmation.

### Type detection

| Signal words | Inferred type |
|---|---|
| fix, bug, broken, crash, error, wrong, stale | `bug` |
| add, new, implement, create, build, support | `feature` |
| exercise, word, grammar, sentence, prompt, content | `content` |
| migrate, deploy, CI, config, lint, test, build, Nix | `infra` |
| refactor, clean, rename, update deps, reorganize | `chore` |

### Area detection

| Signal words | Inferred area |
|---|---|
| quiz, exercise, cloze, multiple choice, word order | `quiz` |
| word, vocabulary, inflection, dictionary, verb, noun | `vocabulary` |
| grammar, topic, rule, conjugation, explanation | `grammar` |
| SRS, FSRS, card, review, spaced, scheduling | `srs` |
| layout, mobile, responsive, dark mode, button, page, CSS | `ui` |
| scrape, scraper, SpeakSpeak, speakandlearn, Moodle | `scraping` |
| Supabase, migration, database, RLS, table, SQL | `db` |
| auth, login, sign in, sign up, token, session | `auth` |
| progress, stats, chart, streak, analytics | `analytics` |
| CI, build, lint, Nix, deploy, Vercel, DX, tooling | `dx` |

### Priority detection

| Signal words | Inferred priority |
|---|---|
| critical, urgent, blocks everything, security, ASAP | `p0` |
| important, should, next, soon, high priority | `p1` |
| _(no signal — default)_ | `p2` |
| nice to have, someday, low, minor, eventually | `p3` |

### Effort detection

| Signal words | Inferred effort |
|---|---|
| quick, one-liner, trivial, just change, tiny | `xs` |
| small, simple, straightforward | `s` |
| _(no signal — default)_ | `m` |
| complex, multiple files, needs research, several | `l` |
| epic, multi-session, whole system, major rewrite | `xl` |

### Exam scope detection

| Signal | Inferred scope |
|---|---|
| Mentions PD2 or Module 2 content specifically | `PD2` |
| Mentions PD3M1 or Module 3.1 content | `PD3M1` |
| Mentions PD3M2 or Module 3.2 content | `PD3M2` |
| Infrastructure, UI, or cross-cutting concern | `all` |
| Not exam-related at all | `—` |

### Default status

New items start as `ready` unless the user says "just an idea", "maybe", "someday", or "thinking about" — then use `idea`.

---

## Sync rules (critical)

Every time you modify `docs/backlog.md`, follow these rules exactly:

1. **Read the entire file first.** Never make partial reads.
2. **Parse both the summary table and detail sections** into your working memory.
3. **Apply the requested changes** to your mental model.
4. **Regenerate and write the complete file** using the Write tool. Never use Edit to patch a single line — always rewrite the full file. This prevents sync drift between the table and detail sections.
5. **Update header counts** after every modification.
6. **Preserve ID order** — items stay in creation order. Priority is a metadata field, not position.
7. **Truncate titles in the table** to 50 characters with `...` if longer.
8. **Dependencies column**: comma-separated IDs (`BL-001, BL-003`) or `—` for none.

### Archive rule

When active items (not `done`/`dropped`) exceed 80, move all `done` and `dropped` items to `docs/backlog-archive.md` to keep the main file manageable.

---

## Import procedure (`/backlog import`)

One-time migration from `NOTES.md` into `docs/backlog.md`.

### Steps

1. Read `NOTES.md` and `docs/backlog.md`
2. Parse unchecked items from each NOTES.md section
3. Deduplicate — Known Issues often repeats High Priority items. Keep the version with more detail.
4. Map each item using these defaults:

| NOTES.md section | Status | Priority |
|---|---|---|
| High Priority unchecked | `ready` | `p1` |
| Requires Credentials unchecked | `ready` | `p1` |
| Medium Priority unchecked | `ready` | `p2` |
| Low Priority unchecked | `idea` | `p3` |
| Known Issues (unique only) | `ready` | `p2` |
| Completed (checked) | **Skip** — do not import |

5. Auto-assign type, area, effort, and scope using the heuristics above
6. Present the full proposed import list to the user for review before writing
7. Write all items to `docs/backlog.md`
8. Add a redirect notice at the top of NOTES.md:
   ```
   > Backlog items migrated to [docs/backlog.md](docs/backlog.md) on YYYY-MM-DD.
   > This file now tracks session logs and completed work history only.
   ```
9. Remove the unchecked item sections from NOTES.md (keep Completed + Known Issues as history)

---

## Integration with other skills

- After completing work on a backlog item, run `/backlog done BL-NNN` before creating a PR
- The `/commit` skill references the backlog for tracking completed items

## Rules

- Always use today's date for timestamps
- Never modify the file on read-only operations (dashboard, list, view, next)
- Always confirm with the user before writing new items or making bulk changes
- IDs are permanent — never reuse a dropped/done item's ID
- Keep the file valid GitHub-flavored markdown at all times
