# DanskPrep — Danish Exam Preparation App

## Project Overview

DanskPrep is an exam-focused Danish language learning web app. Scope: strictly what gets tested in Danish exams (Prøve i Dansk). Uses spaced repetition (FSRS), active recall, typed production, cloze deletion, and sentence construction.

**Current Phase:** MVP — PD3 Module 2 exam content
**Target Exams:** PD1, PD2, PD3, Studieprøven (Modules 1–5)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 6 + TypeScript (strict) |
| Styling | Tailwind CSS v3 + shadcn/ui (manual) |
| SRS Engine | ts-fsrs (client-side) |
| Backend/DB | Supabase (PostgreSQL + Auth + REST) |
| Hosting | Vercel |
| JS | npm |
| Python | 3.12+ via uv (never pip) |
| System deps | Nix (flake.nix) + direnv (.envrc) |

## Key Directories

```
src/components/   — React components by domain (layout, study, quiz, grammar, etc.)
src/pages/        — Route pages (Home, Study, Quiz, Grammar, Vocabulary, Progress, etc.)
src/lib/          — Core logic (supabase, fsrs, quiz-engine, answer-check, danish-input)
src/hooks/        — Custom hooks (useAuth, useStudy, useQuiz, useWords, useProgress, etc.)
src/types/        — TypeScript types (database, study, quiz, grammar)
src/data/seed/    — JSON seed files (exercises, words, grammar, sentences, prompts)
supabase/         — Migrations (001–008) + apply-all-migrations.sql
scripts/          — Python scripts (scraping, seeding, enrichment)
.claude/          — Skills, rules, references for Claude Code
```

## Database Schema

Key tables (see `supabase/migrations/` for full schema):

| Table | Purpose | RLS |
|-------|---------|-----|
| `words` | Vocabulary + JSONB inflections | Public read |
| `grammar_topics` | Grammar explanations by module | Public read |
| `exercises` | Quiz questions, all types | Public read |
| `sentences` | Danish/English pairs | Public read |
| `user_cards` | FSRS state per user per item | Private (user_id) |
| `review_logs` | Review history for analytics | Private (user_id) |
| `bubble_scores` | Word bubble game scores | Guest or owner |

## Exercise Types

| Type | ID | Description |
|------|----|-------------|
| Type answer | `type_answer` | See prompt, type Danish/English answer |
| Cloze | `cloze` | Sentence with blank, type missing word |
| Multiple choice | `multiple_choice` | 4 options, select correct one |
| Word order | `word_order` | Jumbled words, arrange into correct sentence |
| Error correction | `error_correction` | Sentence with error, user fixes it |
| Matching | `matching` | Match Danish-English pairs |
| Conjugation | `conjugation` | Fill in all tense forms |

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run test         # Vitest
npm run lint         # ESLint
npm run types        # Generate Supabase types
```

Python scripts: `cd scripts && uv run python <script>.py`

## Development Flow

```
feature branch → PR → CI/CD → Claude review → human merge
```

- Never push directly to `main`
- Never merge without passing CI + Claude review
- Use `/commit` skill to ship changes (branch → PR → review → STOP for approval → merge)
- Commit messages: explain *why*, not *what*

## Strict TypeScript — Unused Imports

`noUnusedLocals: true` is enabled. **When editing a file, always check whether the change makes any existing imports unused and remove them in the same edit.** Do not leave cleanup for a separate step — unused imports fail `tsc --noEmit` and CI. Common cases: removing a function call that was the only use of an import, replacing a component with a different one, extracting logic to a hook.

## Key Design Principles

1. **Exam-focused only** — Every feature maps to an exam topic
2. **Production over recognition** — Typed answers preferred over multiple choice
3. **Mobile-ready** — All layouts work on 375px+, dark mode from day 1
4. **Legally clean** — Original content only, never copy textbook text
5. **Offline-capable SRS** — FSRS runs client-side, sync on reconnect
6. **AI-native** — Documents use clear structure, explicit context, and machine-parseable formats so AI agents can consume them effectively. APIs should be designed for AI integration (e.g. exposable via MCP servers)

## Floating Bubbles — Always Interactive

The `FloatingWords` component in `Layout.tsx` must always render with `interactive={true}`. Never set `interactive={false}` — the user wants bubbles clickable on every page, not just the welcome page.

## Environment Variables

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Never commit `.env.local`.

## Agents & Skills

| Name | Type | Purpose |
|------|------|---------|
| `/backlog` | Skill | Manage backlog via GitHub Projects (#15) — add, list, filter, update, prioritize, deps graph |
| `/retro` | Skill | End-of-session retrospective, update backlog + session log |
| `/scope` | Skill | Break a backlog item into sub-tasks with effort/risk |
| `/release` | Skill | Cut a release — assess changes since last tag → changelog → version bump → release PR |
| `/some` | Skill | Social media post generator (LinkedIn/Twitter/FB) |
| `coder` | Agent | Autonomous dev cycle: pick item → code → test → PR → retro |
| `pm` | Agent | Exam-aligned research, roadmap planning, feature breakdown |
| `data-engineer` | Agent | Gather official exam data, validate, map to schema, enrich |
| `test-frontend` | Agent | Playwright visual/a11y/interaction tests with screenshots |
| `project-review` | Agent | 8-dimension project health audit |
| `spike-research` | Agent | Technical deep-dive research → `docs/spikes/` |
| `content-generator` | Agent | Danish exercise/grammar content generation |

Reports output to: `docs/pm/`, `docs/spikes/`, `docs/reviews/`, `docs/test-reports/`, `docs/some/`

## Exam Level Naming Convention

The user is enrolled in PD3 courses at mit.speakspeak.dk. The app MVP content is PD3 Module 2.

| --exam flag | Course name on SpeakSpeak | Seed files | module_level |
|-------------|---------------------------|------------|--------------|
| PD2   | modul 2   | exercises-pd2.json    | 2 |
| PD3M1 | modul 3.1 | exercises-pd3m1.json  | 3 |
| PD3M2 | modul 3.2 | exercises-pd3m2.json  | 3 |

- **No PD4** — user is not enrolled in that level
- Existing MVP seed files use PD3M2 naming: `exercises-pd3m2.json`, `grammar-pd3m2.json`, `words-pd3m2.json`, `sentences-pd3m2.json`
- The `"source": "module2-core"` field inside words JSON is a provenance tag — do not change it

## Where to Find Detailed Rules

Code conventions, TS pitfalls, Nix setup, and Supabase workflow are in `.claude/rules/` (auto-loaded).
Domain knowledge (Danish grammar, FSRS config, Supabase patterns) are in `.claude/references/` (loaded by skills on demand).
