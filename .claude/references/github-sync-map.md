# GitHub Sync Map — AI workflow ↔ Manual workflow

Two development paths exist for this project. This file maps equivalent configurations so when one changes, the other stays in sync.

## Cross-reference

| Concern | AI path (.claude/) | Manual path (.github/) | Shared source of truth |
|---------|--------------------|-----------------------|----------------------|
| PR body format | `references/pr-templates.md` | `pull_request_template.md` | `references/pr-templates.md` |
| Branch naming | `skills/commit/SKILL.md` (Step 2) | `workflows/branch-name.yml` | Branch prefixes: `fix/`, `feat/`, `docs/`, `chore/`, `refactor/`, `release/` |
| CI checks | `skills/commit/SKILL.md` (Step 3–4) | `workflows/ci.yml` | Commands: `tsc --noEmit`, `lint`, `test`, `build` |
| Python checks | `skills/commit/SKILL.md` | `workflows/python-lint.yml` | Ruff + syntax check |
| Issue creation | `skills/backlog/SKILL.md` (`/backlog add`) | `ISSUE_TEMPLATE/*.yml` | BL-NNN title format, labels, project fields |
| Label schema | `skills/backlog/SKILL.md` (Labels section) | `labels.yml` | `type:*`, `area:*`, `status:*` |
| Project field IDs | `skills/backlog/SKILL.md` (Field IDs section) | `workflows/auto-project.yml` | Project #15, field IDs |
| Release flow | `skills/release/SKILL.md` | `workflows/release.yml` | Version from `package.json`, changelog from `changelog.json` |
| Code ownership | `CLAUDE.md` (Key Directories) | `CODEOWNERS` | Path → owner mapping |
| Dependency updates | — | `dependabot.yml` | Manual only (no AI equivalent needed) |

## Update rules

When you change **any** of these, update the paired file:

| If you change... | Also update... |
|------------------|---------------|
| PR template in `references/pr-templates.md` | `.github/pull_request_template.md` |
| Branch prefixes in `/commit` skill | `workflows/branch-name.yml` regex pattern |
| CI commands in `/commit` skill | `workflows/ci.yml` steps |
| Label names in `/backlog` skill | `.github/labels.yml` + `ISSUE_TEMPLATE/*.yml` dropdowns |
| Issue fields in `/backlog` skill | `ISSUE_TEMPLATE/*.yml` form fields |
| Project field IDs in `/backlog` skill | `workflows/auto-project.yml` |
| Release logic in `/release` skill | `workflows/release.yml` |
| New area or type added to backlog | `.github/labels.yml` + issue template dropdowns |

## How to verify sync

Quick check — run these to compare:

```bash
# Branch prefixes: skill vs workflow
grep -oP '(fix|feat|docs|chore|refactor|release)/' .claude/skills/commit/SKILL.md | sort -u
grep -oP '(fix|feat|docs|chore|refactor|release)' .github/workflows/branch-name.yml | sort -u

# Labels: backlog skill vs labels.yml
grep -oP 'type:\w+|area:\w+|status:\w+' .claude/skills/backlog/SKILL.md | sort -u
grep -oP 'type:\w+|area:\w+|status:\w+' .github/labels.yml | sort -u

# CI commands: skill vs workflow
grep -oP 'tsc|lint|test|build' .claude/skills/commit/SKILL.md | sort -u
grep -oP 'tsc|lint|test|build' .github/workflows/ci.yml | sort -u
```
