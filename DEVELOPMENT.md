# Development Guide

Setup, commands, workflow, and the agent/skill ecosystem for contributing to DanskPrep.

## Getting Started

1. **System dependencies** — managed via Nix + direnv (see `flake.nix`):
   ```bash
   direnv allow   # auto-loads Node, Python, uv, supabase-cli
   ```

2. **Install and run:**
   ```bash
   cp .env.example .env.local   # add Supabase URL + anon key
   npm install
   npm run dev                  # http://localhost:5173
   ```

   The app runs with bundled seed data immediately — no database seeding required.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 6 + TypeScript (strict) |
| Styling | Tailwind CSS v3 + shadcn/ui (manual install) |
| SRS Engine | ts-fsrs (client-side) |
| Backend/DB | Supabase (PostgreSQL + Auth + REST) |
| Hosting | Vercel |
| JS | npm |
| Python | 3.12+ via uv (never pip) |
| System deps | Nix (flake.nix) + direnv (.envrc) |

## Commands

### npm

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite, port 5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run types` | Generate Supabase TypeScript types |

### Python Scripts

All Python tooling uses **uv** (never pip). Scripts live in `scripts/` with their own `pyproject.toml`.

```bash
cd scripts
uv venv --python 3.12 .venv   # one-time setup
uv sync

# Scrape exercises from SpeakSpeak (requires saved cookies)
uv run python scrape-speakspeak.py --exam PD3M2 --cookies cookies.json

# Enrich vocabulary with AI-generated inflections (requires ANTHROPIC_API_KEY)
uv run python enrich-vocabulary.py

# Enrich verb inflections via local Ollama (no API key needed)
uv run python enrich-via-ollama.py

# Verify exercise answers and hints
uv run python verify-exercises.py
```

## Project Structure

See [docs/architecture.md](docs/architecture.md) for the full directory tree with per-directory descriptions.

## Development Workflow

DanskPrep uses an **AI-first methodology** powered by [Claude Code](https://claude.com/claude-code). Skills and agents manage the full lifecycle — from research to shipping.

### Daily Flow

```
/daily start → pick work → code → /daily wrap
```

1. **`/daily start`** — opens the backlog dashboard, shows in-progress and ready items, helps you pick work
2. **Work** — code, test, iterate
3. **`/daily wrap`** — runs `/commit` (which includes `/simplify` internally), then `/retro`

### Weekly Flow

```
/weekly → review progress → prioritize → /release (if ready)
```

`/weekly` reviews the past week's progress, re-prioritizes the backlog, checks if a release is warranted, and plans the next week.

### How Skills Chain Together

```
/daily start
    └─▶ /backlog (dashboard)
         └─▶ pick item(s) → set in-progress

  Single item:                    Multiple items:
  ... work ...                    /parallel BL-044 BL-007
                                      ├─▶ file overlap check
                                      ├─▶ agent 1 (worktree) → PR
                                      ├─▶ agent 2 (worktree) → PR
                                      └─▶ collect results → review

/daily wrap
    └─▶ /commit (or /parallel merge)
    │       ├─▶ /simplify (code cleanup)
    │       ├─▶ self-review
    │       ├─▶ docs update
    │       └─▶ STOP for human approval → merge
    └─▶ /retro
            ├─▶ session summary
            ├─▶ backlog status updates
            └─▶ next session priorities
```

## Skills Reference

| Skill | Trigger | What it does |
|-------|---------|-------------|
| `/daily` | Session start/end | Daily session wrapper — backlog → work → commit → retro |
| `/weekly` | Weekly review | Prioritize backlog, review progress, release check, plan ahead |
| `/backlog` | Task management | Add, list, filter, update, prioritize backlog items; dependency-aware (`deps`, `next` excludes blocked) |
| `/scope` | Planning | Break a backlog item into sub-tasks with effort and risk |
| `/parallel` | Parallel work | Pre-flight + auto-launch terminals for 2-3 non-overlapping BL items |
| `/commit` | Ship code | Branch → PR → simplify → self-review → fix → docs → human approval → merge |
| `/release` | Cut a release | Assess changes since last tag → changelog → version bump → release PR |
| `/retro` | Session close | Summarize work, update backlog, append session log, suggest next priorities |
| `/simplify` | Code review | Review changed code for reuse, quality, efficiency; fix issues |
| `/some` | Social media | Generate posts for LinkedIn, Twitter, Facebook |
| `/qa-review` | Testing | Audit test coverage, write missing tests |
| `/security-review` | Security | OWASP Top 10 audit, deps, secrets, RLS |
| `/architecture-review` | Architecture | Review design decisions, write ADRs |
| `/add-word` | Vocabulary | Add a Danish word with correct inflections to seed data |
| `/generate-exercises` | Content | Generate exercise batch for a grammar topic |
| `/seed-module` | Content | Prepare complete seed data package for an exam module |
| `/review-danish` | Content | Review Danish text for grammar accuracy |
| `/supabase-sync` | Database | Push migrations and seed data to Supabase |
| `/scrape-speakspeak` | Scraping | Scrape SpeakSpeak Moodle into seed data |
| `/scrape-gyldendal` | Scraping | Scrape Gyldendal modultest into seed data |
| `/update-changelog` | Changelog | Add entry, bump version, sync all locations |
| `/figma-to-code` | UI | Translate Figma designs into React + Tailwind |
| `/quiz-engine` | Quiz logic | Implement or extend quiz functionality |
| `/fsrs-integration` | SRS | Implement or extend spaced repetition with ts-fsrs |
| `/data-architect` | Database | Design/review schema, migrations, RLS policies |
| `/danish-grammar-content` | Reference | Reference for generating Danish exam content |

## Agents Reference

| Agent | Purpose | Output |
|-------|---------|--------|
| **pm** | Exam-aligned research, roadmap planning, feature breakdown | `docs/pm/` |
| **coder** | Autonomous dev cycle: pick item → code → test → PR → retro | PRs |
| **data-engineer** | Gather official exam data, validate, map to schema, enrich | Seed data |
| **content-generator** | Danish exercise and grammar content generation | Seed JSON |
| **test-frontend** | Playwright visual/a11y/interaction tests with screenshots | `docs/test-reports/` |
| **project-review** | 8-dimension project health audit | `docs/reviews/` |
| **spike-research** | Technical deep-dive research | `docs/spikes/` |

Agent definitions live in `.claude/agents/`. Reports output to `docs/` subdirectories.

## Content Pipeline

```
SpeakSpeak Moodle
    │  scrape-speakspeak-full.py
    ▼
Raw course dump (JSON)
    │  process-full-dump.py
    ▼
Extracted exercises + text
    │  content-generator agent (Claude Code)
    ▼
Clean seed exercises
    │  vocabulary extraction + enrichment
    ▼
src/data/seed/exercises-pd3m2.json
src/data/seed/words-pd3m2.json
    │  seed-database.py + /supabase-sync
    ▼
Supabase (production DB)
    │  (future: BL-043)
    ▼
React app loads at runtime
```

See [docs/data-pipeline.md](docs/data-pipeline.md) for the full pipeline documentation including H5P extraction details, grammar topic mapping, and file inventory.

## Rules & Conventions

Auto-loaded rules live in `.claude/rules/`:

| Rule | What it enforces |
|------|-----------------|
| `react-conventions.md` | Components, styling, state, routing patterns |
| `typescript-tooling.md` | Vite/Vitest config, strict mode, answer checking |
| `supabase-workflow.md` | Run `/supabase-sync` after creating migrations |
| `nix-system-deps.md` | All system tools through Nix, never brew/apt |
| `python-lint.md` | Ruff checks before committing Python |
| `ui-feedback.md` | Use agentation annotations for visual fixes |
| `github-sync.md` | Keep `.claude/` and `.github/` counterparts in sync |
| `dev-guide-sync.md` | Update DEVELOPMENT.md when skills/agents change |

Reference docs (loaded by skills on demand) are in `.claude/references/`.
