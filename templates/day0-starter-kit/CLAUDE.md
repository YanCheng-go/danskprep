# [Project Name]

> One-line description of what this project does and who it's for.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | |
| Styling | |
| Backend/DB | |
| Hosting | |
| Package manager | |
| System deps | Nix (flake.nix) + direnv (.envrc) |

## Architecture Decisions

> Fill these in BEFORE the first feature commit. These prevent 80% of rework.

### Auth Model
<!-- Choose one and delete the others -->
- [ ] **Guest-first** — anyone can use the app immediately; sign-in unlocks persistence/sync
- [ ] **Auth-required** — sign-in required before any functionality
- [ ] **Hybrid** — some features public, some gated

### Data Flow
<!-- Choose one and delete the others -->
- [ ] **API-first** — app fetches data from backend at runtime; seed data for bootstrapping only
- [ ] **Bundled** — data ships as JSON in the frontend bundle
- [ ] **Offline-first** — local-first with background sync

### ID Strategy
<!-- Choose one and delete the others -->
- [ ] **Deterministic hash** — `sha256(source + type + content)[:12]` — stable across re-imports
- [ ] **UUID v4** — random, globally unique
- [ ] **Auto-increment** — DB-managed sequential IDs

### i18n
<!-- Choose one and delete the others -->
- [ ] **Yes** — framework: _________, use `t('key')` from first component
- [ ] **No** — single language: _________

### State Management
<!-- Choose one and delete the others -->
- [ ] **Local only** — useState/useReducer, no global store
- [ ] **Client + sync** — local state with background sync to DB
- [ ] **Real-time** — live subscriptions (e.g., Supabase Realtime)

## UX Invariants

> Things that must ALWAYS be true. Add project-specific rules here.

- Mobile: all layouts work on 375px+, mobile-first (base styles for mobile, `md:` for desktop)
- Touch targets: interactive elements at least 44x44px
- Dark mode: every light-mode color has a `dark:` variant
- A11y: `aria-label` on all icon-only buttons, `role` on custom widgets, keyboard navigation

## Quality Gates

> Every PR must pass ALL of these before merge.

```bash
npx tsc --noEmit          # TypeScript strict
npm run lint              # ESLint (includes jsx-a11y)
npm test -- --run         # Unit tests
npm run build             # Production build
```

## Key Directories

```
src/components/   — React components by domain
src/pages/        — Route pages
src/lib/          — Core logic
src/hooks/        — Custom hooks
src/types/        — TypeScript types
src/data/seed/    — Seed data (JSON)
```

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run test         # Tests
npm run lint         # Lint
```

## Anti-Patterns (Do NOT Do These)

- Never use `any` without a comment explaining why
- Never use inline `style={}` — Tailwind only
- Never fetch data inside components — use hooks or page components
- Never commit `.env.local` or files containing secrets
- Never modify existing migration files — create new ones
- Never use `export default` — named exports only

## Agents & Skills

| Name | Type | Purpose |
|------|------|---------|
| `/commit` | Skill | Branch → PR → review → fix → human approval → merge |
| `/backlog` | Skill | Manage backlog items |
| `/release` | Skill | Cut a versioned release |
| `coder` | Agent | Autonomous dev cycle with checkpoints |
| `reviewer` | Agent | Read-only code/a11y/security audit |

## Where to Find Detailed Rules

Code conventions and tooling pitfalls: `.claude/rules/` (auto-loaded every session).
Domain knowledge and patterns: `.claude/references/` (loaded by skills on demand via `globs:`).
