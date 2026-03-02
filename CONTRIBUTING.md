# Contributing to DanskPrep

## Development Flow

```
feature branch → PR → CI → Claude review → human approves → squash merge → main
```

### Rules
- **Never push directly to `main`** — all changes go through a PR
- **Never merge without passing CI** — both `CI` and `Python Lint` checks must be green
- **Never merge without Claude review** — run `/review <pr-number>` and paste the output in the PR
- **Human approval required** — at least one human approval before merge
- **Squash merge only** — keeps `main` history linear and readable

---

## Branch Naming

```
feature/<short-description>     # new functionality
fix/<short-description>         # bug fixes
content/<module>-<topic>        # exercise / vocabulary data
refactor/<short-description>    # code restructuring
chore/<short-description>       # tooling, deps, CI
docs/<short-description>        # documentation only
security/<short-description>    # security fixes (treat as urgent)
```

---

## Starting a New Feature

```bash
# 1. Always branch from up-to-date main
git checkout main && git pull origin main

# 2. Create your feature branch
git checkout -b feature/my-feature

# 3. Make changes, commit often with descriptive messages
git commit -m "why this change, not what"

# 4. Before opening PR — run the full check suite locally
npx tsc --noEmit       # TypeScript
npm run lint           # ESLint
npm test -- --run      # Vitest
npm run build          # Production build

# 5. Open PR using the commit skill
# (Claude handles NOTES.md, README.md, PR creation)
```

---

## Commit Messages

Format: `<type>(<scope>): <what and why>`

```
feat(quiz): add word-order exercise type for Module 2
fix(fsrs): correct due-date calculation after Again rating
content(pd3m2): add 34 scraped exercises from SpeakSpeak
chore(deps): bump ts-fsrs to 4.4.0
security(rls): enforce RLS policy on sentences table
docs(claude): add DevSecOps skill for security review
```

Types: `feat`, `fix`, `content`, `refactor`, `test`, `chore`, `docs`, `security`, `perf`

---

## SDLC Roles & Responsibilities

| Role | Responsibility | Claude skill |
|------|---------------|-------------|
| **Product Owner** | Requirements, prioritisation, NOTES.md | — |
| **UI/UX Designer** | Figma prototypes → Tailwind components | `/figma-to-code` |
| **Solution Architect** | ADRs, system design, API contracts | `/architecture-review` |
| **Data Architect** | Schema, migrations, query patterns | `/data-architect` |
| **Frontend Engineer** | React components, hooks, pages | `/react-components`, `/new-component` |
| **Content Engineer** | Exercises, seed data, scraping | `/generate-exercises`, `/scrape-speakspeak` |
| **DevSecOps Engineer** | CI/CD, secrets, OWASP, deployments | `/security-review` |
| **QA Engineer** | Test strategy, E2E, coverage | `/qa-review` |
| **Performance Engineer** | Bundle size, Lighthouse, load tests | `/performance-check` |
| **Danish Expert** | Grammar review, exam alignment | `/review-danish` |

---

## Adding Dependencies

### npm
```bash
# Runtime dependency
npm install <package>

# Dev-only (tooling, types, test utils)
npm install -D <package>
```
Always confirm the package appears in the correct section of `package.json` before committing.

### Python (scripts only)
```bash
cd scripts
uv add <package>          # runtime
uv add --dev <package>    # dev/lint only
```
Never use `pip install` directly — always `uv add` so `pyproject.toml` stays in sync.

---

## Security

- Never commit `.env.local` or any file containing real API keys
- Run `/security-review` before any PR that touches auth, Supabase client, or environment config
- Report vulnerabilities privately — see [SECURITY.md](SECURITY.md)

---

## Questions?

Open a GitHub Discussion or check `CLAUDE.md` for architecture and convention details.
