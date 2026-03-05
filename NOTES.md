# DanskPrep — Development Notes

Session logs and historical notes. Active work items are tracked in [GitHub Projects](https://github.com/users/YanCheng-go/projects/15).

---

## Session Log

### Session 2026-03-06 — commit flow fixes + human review gates
- [x] BL-055: Fix `/commit` to branch before committing (PR #124)
- [x] Added AI context warning to `/commit` Step 7
- [x] Added `requires:human-review` label auto-detection to `/backlog add`
- [x] Added `save-decisions-early` rule
- [x] Created BL-056: Context hygiene lint script + weekly audit
- [x] Created BL-057: Sync agent-skill patterns to starter kit
- [ ] PR #127: human-review detection — waiting on CI

### Session 2026-03-05 — process fixes + parallel skill
- [x] Fixed 4 stale backlog items stuck as "In Progress" on project board (BL-030, BL-035, BL-036, BL-037)
- [x] Added project board sync step to `/commit` skill (PR #118)
- [x] Built `/parallel` skill for multi-agent concurrent work (PR #119)
- [x] Created BL-052–BL-055: agent/skill redesign + commit fix backlog items

### Session 2026-03-02 #6 — Infrastructure & tooling
- [x] Supabase migrations pushed (001-008)
- [x] `/supabase-sync` skill created
- [x] Skills format fix — all 17 skills converted to directory format
- [x] Rules vs References split — moved 4 rarely-used rules to references
- [x] Nix + direnv setup
- [x] CLAUDE.md slimmed from 308 to 106 lines

### Session 2026-03-02 #5 — PR #25 code review fixes
- [x] Tightened RLS policies for `bubble_scores`
- [x] Fixed timer cleanup leak in WordBubble
- [x] WelcomeGate redirect fix
- [x] Browser locale detection
- [x] Extracted `useBubbleGame` hook

### Session 2026-03-02 #4 — Bubble game session model
- [x] Bubble session redesign with multi-nickname DB model
- [x] Guest vs signed-in scoring
- [x] Clickable leaderboard rows
- [x] Migration 006-008

### Session 2026-03-02 #3 — Bubble Word Game
- [x] Floating Danish word bubbles with click-to-discover
- [x] Game leaderboard with localStorage + Supabase sync
- [x] Trophy badge + GamePanel inline

### Session 2026-03-02 #2 — Support, dictionary, feedback
- [x] Support redesign (renamed from "Donate")
- [x] Dictionary inflections from DDO
- [x] In-App Feedback with Supabase + mailto fallback
- [x] WhatsNew banner, Drill mode, Vocabulary pagination

### Session 2026-03-02 #1 — Study mode + data enrichment
- [x] Study mode Daily/All toggle
- [x] Vocabulary inflection tables
- [x] Exercises: 102 to 201; Words: 71 to 277
- [x] Scraping + enrichment scripts

### Session 2026-03-01 — Project bootstrap
- [x] README, Vercel Analytics, lazy-loaded routes
- [x] SpeakSpeak + Gyldendal scrapers
- [x] Initial 35 exercises scraped from PD3M2

---

## Known Issues

- **143 verbs with empty inflections** — run `enrich-vocabulary.py` with `ANTHROPIC_API_KEY`
- **WordOrder UX** — no reorder without clearing; needs click-to-remove or dnd
- **Writing & Speaking modes** — need `ANTHROPIC_API_KEY` for AI scoring
