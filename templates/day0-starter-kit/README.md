# Day 0 Starter Kit for Claude Code Projects

> Copy this template into your new project root before the first feature commit.

## What's Inside

```
CLAUDE.md                                — Project constitution (fill in before coding)

.claude/
  rules/                                 — Auto-loaded every session
    data-architecture.md                 — ID strategy, data flow, seed format, migrations
    auth-model.md                        — Guest-first vs auth-required, implementation rules
    a11y-checklist.md                    — Per-component accessibility requirements + CI setup
    mobile-first.md                      — 375px base, pre-merge testing checklist
    security-model.md                    — Secrets, CSP, RLS, rate limiting, input validation
    shipping-workflow.md                 — Branch → PR → review → merge (design once)
    github-sync.md                       — Keep .claude/ and .github/ in sync
    dev-guide-sync.md                    — Update dev guide when skills/agents change

  skills/                                — User-invocable via /command
    commit/SKILL.md                      — Full ship cycle with human checkpoint
    backlog/SKILL.md                     — Backlog management (add, list, update, next)
    release/SKILL.md                     — Versioned releases with changelog
    retro/SKILL.md                       — Session retrospective + backlog updates
    scope/SKILL.md                       — Break items into sub-tasks with effort/risk
    daily/SKILL.md                       — Daily session wrapper (backlog → work → commit → retro)
    weekly/SKILL.md                      — Weekly review (progress, prioritize, release check)
    qa-review/SKILL.md                   — Test coverage audit + write missing tests
    security-review/SKILL.md             — OWASP-aligned security audit
    update-changelog/SKILL.md            — Changelog entry + version bump
    some/SKILL.md                        — Social media post generator

  agents/                                — Autonomous multi-step workflows
    coder.md                             — Autonomous dev cycle with learning filter
    reviewer.md                          — Read-only code/a11y/security/mobile audit
    project-review.md                    — 8-dimension project health scored audit
    spike-research.md                    — Technical deep-dive → structured decision doc

  references/                            — Loaded on-demand via globs: frontmatter
    example-reference.md                 — Template showing the globs: pattern
    github-sync-map.md                   — AI ↔ manual path cross-reference table
    pr-templates.md                      — Standard + release PR body templates

  settings.local.json                    — Pre-approved safe commands

.github/                                 — GitHub automation (manual contributor path)
  workflows/
    ci.yml                               — TypeScript + Lint + Test + Build
    branch-name.yml                      — Validate branch naming convention
    release.yml                          — Auto-create GitHub Release on version bump
    label-sync.yml                       — Sync labels.yml to GitHub
    auto-project.yml                     — Auto-add new issues to Project board
  ISSUE_TEMPLATE/
    bug_report.yml                       — Bug report with priority/effort fields
    feature_request.yml                  — Feature request with acceptance criteria
    config.yml                           — Disable blank issues, link to project board
  pull_request_template.md               — PR checklist (code, security, docs)
  labels.yml                             — Label-as-code (type:*, area:*, status:*)
  dependabot.yml                         — Weekly grouped dependency updates
  CODEOWNERS                             — Auto-assign reviewers by path
```

## How to Use

### 1. Copy into new project
```bash
cp -r templates/day0-starter-kit/{CLAUDE.md,.claude,.github} /path/to/new-project/
```

### 2. Fill in CLAUDE.md (before writing any code)
- Project name and description
- Tech stack
- **Architecture decisions** — auth model, data flow, ID strategy, i18n, state management
- **UX invariants** — project-specific rules that must always hold
- Anti-patterns specific to your project

### 3. Customize rules
- `data-architecture.md` — choose your ID strategy and data flow
- `auth-model.md` — choose guest-first vs auth-required
- `security-model.md` — adjust CSP, auth provider, rate limiting approach
- Delete rules that don't apply to your project

### 4. Wire up skills
- `/backlog` — set your GitHub Projects number or choose file-based
- `/commit` — adjust quality gate commands for your stack
- `/release` — set changelog location and version source of truth
- `/some` — set your project URL and repo link

### 5. Wire up GitHub
- `CODEOWNERS` — replace `@OWNER` with your username
- `auto-project.yml` — replace `PROJECT_NUMBER` and `OWNER`
- `labels.yml` — add project-specific `area:*` labels
- `dependabot.yml` — adjust package groupings for your dependencies
- `ISSUE_TEMPLATE/config.yml` — update project board URL

### 6. Add domain-specific references
Create `.claude/references/your-domain.md` with `globs:` frontmatter targeting relevant source files. This auto-loads domain knowledge when the AI touches those files.

### 7. Start building!

## Three-Tier Context Loading

This kit uses the same loading strategy proven in DanskPrep:

| Tier | Location | When Loaded | Purpose |
|------|----------|-------------|---------|
| 1 | `CLAUDE.md` + `.claude/rules/` | Every session (auto) | Architecture decisions, coding conventions |
| 2 | `.claude/references/` | When matching files opened (via `globs:`) | Domain knowledge, patterns |
| 3 | `.claude/skills/` + `.claude/agents/` | On invocation only | Workflows, automation |

## Key Principle: Globs Are the Best Context Engineering

Every reference file should have `globs:` in its YAML frontmatter. This auto-loads the right knowledge at the right time with zero manual effort. Without globs, references are dead weight.

```yaml
---
globs:
  - "src/lib/auth*.ts"
  - "src/hooks/useAuth*.ts"
---
```

## Origin

Extracted from lessons learned building DanskPrep (March 2026).
Based on analysis of 145 commits, 100 PRs, and 8 releases over 4 days.
See the full retrospective: `docs/retrospectives/2026-03-04-context-engineering-retrospective.md`
