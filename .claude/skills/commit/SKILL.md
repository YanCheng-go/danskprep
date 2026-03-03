---
name: commit
description: Commit, branch, PR, self-review, fix — then stop for human approval before merge
user-invocable: true
---

# /commit — Ship Cycle

Commit → branch → PR → self-review → fix → docs → **STOP for human approval** → merge. **Never push directly to main.**

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

## Step 5 — Update documentation

Review and update all relevant docs on the PR branch. Commit doc updates separately from code changes.

Checklist — update each file **only if the PR makes it stale**:

| Doc | When to update |
|-----|---------------|
| `README.md` | Content counts (words, exercises), Roadmap checkboxes, Features list, Python Scripts, Stack |
| `NOTES.md` | Check off completed items, remove stale todos, update Known Issues |
| `CLAUDE.md` | New conventions, changed directory structure, new exercise types, new env vars |
| `docs/backlog.md` | Mark related BL-NNN items as `done`, update header counts |

**Do not update a doc if the PR doesn't affect it.** Only touch what's stale.

## Step 6 — Human checkpoint ⛔

**STOP HERE.** Present the following summary to the user and wait for their decision:

```
## PR ready for review

- PR: <PR URL>
- Branch: <branch name>
- Diff: +N / -N lines across M files
- Self-review verdict: Clean / Needs fixes
- CI status: <passing / pending / failing>

Please review the PR. Reply with:
- "merge" — to proceed with squash merge
- "fix <issue>" — to address something before merge
- or any other feedback
```

**Do NOT proceed to Step 7 unless the user explicitly approves the merge.**

## Step 7 — Merge (only on user approval)

1. `gh pr checks <number>` — confirm CI passes (fix failures if any)
2. `gh pr merge <number> --squash --delete-branch` (deletes the remote branch)
3. `git checkout main && git pull --rebase`
4. `git branch -d <branch>` — delete the local branch to keep the workspace clean

## Step 8 — Release reminder

After merge, ask the user:

```
Merged to main. Want to cut a release?
Run /release to assess changes since the last tag and create a release PR.
```

This is just a reminder — the user decides. Do not run `/release` automatically.

---

## Rules

- **Never push to main** — always PR
- **Never merge without user approval** — always stop at Step 6
- **Never skip CI** — wait for checks before merge
- **Clean up unused imports** in the same edit
- **One concern per commit** — separate unrelated changes
- **Docs before merge**: update docs as the final commit on the branch, before requesting review
