---
name: commit
description: Commit, PR, self-review, fix, merge — full ship cycle
user-invocable: true
---

# /commit — Ship Cycle

Commit → branch → PR → self-review → fix → CI → merge. **Never push directly to main.**

| Invocation | Behaviour |
|---|---|
| `/commit` | Auto-detect changes, run full cycle |
| `/commit <message>` | Use provided message as commit summary |

---

## Step 1 — Commit

1. `git status` + `git diff --stat HEAD` to see what changed
2. Check `docs/backlog.md` for related items (match by file/feature keywords)
3. Stage specific files (`git add <files>` — never `-A`; skip `.env`, secrets, unrelated changes)
4. Commit: imperative message, under 70 chars, explains *why*. End with `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

## Step 2 — Branch and PR

1. `git checkout -b <type>/<short-name>` (types: `fix/`, `feat/`, `docs/`, `chore/`, `refactor/`)
2. Merge latest main into the branch to catch conflicts early:
   ```bash
   git fetch origin main && git merge origin/main
   ```
   If there are conflicts, resolve them, commit, and verify (`tsc --noEmit && npm run build && npx vitest run`) before continuing.
3. `gh auth switch --user YanCheng-go` then `git push -u origin <branch>`
4. Create PR — include backlog reference if applicable:

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
- What and why

## Backlog
- Relates to: BL-NNN (or "None")

## Docs updated
- [ ] README.md (if user-facing: roadmap, stack, commands)
- [ ] NOTES.md (check off completed items)

## Test plan
- [ ] `npx tsc --noEmit` + `npm run build` + `npx vitest run`
- [ ] Manually verified: <description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Step 3 — Self-review

1. `gh pr diff <number>` — read the full diff as a reviewer
2. Check for: unused imports, type issues, broken logic, convention violations (CLAUDE.md + `.claude/rules/`), regressions
3. Report to user:
   - **Errors** (must fix), **Suggestions** (nice to have), **Trade-offs** (compromises worth noting)
   - **Verdict**: Clean / Needs fixes

## Step 4 — Fix (if needed)

Fix errors on the same branch → commit → push → re-verify (`tsc --noEmit && build && vitest run`).

## Step 5 — CI and merge

1. `gh pr checks <number>` — wait for CI to pass (fix failures if any)
2. `gh pr merge <number> --squash --delete-branch` (deletes the remote branch)
3. `git checkout main && git pull --rebase`
4. `git branch -d <branch>` — delete the local branch to keep the workspace clean

## Step 6 — Update documentation

**As the very last step before merge**, review and update all relevant docs in the same PR branch. Commit doc updates separately from code changes.

Checklist — update each file **only if the PR makes it stale**:

| Doc | When to update |
|-----|---------------|
| `README.md` | Content counts (words, exercises), Roadmap checkboxes, Features list, Python Scripts, Stack |
| `NOTES.md` | Check off completed items, remove stale todos, update Known Issues |
| `CLAUDE.md` | New conventions, changed directory structure, new exercise types, new env vars |
| `src/data/seed/changelog.json` | Every user-visible change — add new version entry at top |
| `docs/backlog.md` | Mark related BL-NNN items as `done`, update header counts |

**Do not update a doc if the PR doesn't affect it.** Only touch what's stale.

## Step 7 — Update backlog

If PR relates to a backlog item: update `docs/backlog.md` status (`done` or add note), update header counts.

---

## Rules

- **Never push to main** — always PR
- **Never skip CI** — wait for checks before merge
- **Clean up unused imports** in the same edit
- **One concern per commit** — separate unrelated changes
- **Docs last**: update docs as the final commit on the branch, after all code is done
