# Dev Guide Sync Rule

## When this rule applies

- When adding, removing, or renaming a skill in `.claude/skills/`
- When adding, removing, or renaming an agent in `.claude/agents/`
- When changing a skill's workflow (e.g. what other skills it calls)
- During `/commit` self-review (Step 4) and `/retro`

## What to update

1. **Skills Reference table** in `DEVELOPMENT.md` — add/remove/rename the skill row
2. **Agents Reference table** in `DEVELOPMENT.md` — add/remove/rename the agent row
3. **Workflow diagram** in `DEVELOPMENT.md` — if the skill chaining changes (e.g. `/daily wrap` no longer calls `/simplify`)
4. **CLAUDE.md Agents & Skills table** — keep in sync with DEVELOPMENT.md

## How to check

After any skill/agent change, scan the tables in `DEVELOPMENT.md` and verify they match the actual files in `.claude/skills/` and `.claude/agents/`.
