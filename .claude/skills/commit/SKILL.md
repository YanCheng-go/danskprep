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
| `/commit --auto-merge` | Skip human checkpoint (Step 6) — merge immediately after self-review passes |
| `/commit <message> --auto-merge` | Combined: custom message + auto-merge |

> **`--auto-merge`**: Skips the human checkpoint at Step 6. Only use when the user has explicitly confirmed they want to skip review (e.g., trivial changes, docs-only, or user said "just ship it"). The self-review (Step 3) still runs — if it finds errors, stop and fix before merging. Never auto-merge if the self-review verdict is "Needs fixes" without resolving them first.

---

## Step 0 — Pre-flight: sync local main

Before starting, ensure local main is up to date with remote. This catches PRs merged in previous sessions.

```bash
git fetch origin main
```

If currently on a stale branch from a previously merged PR, clean up first:
```bash
git checkout main && git pull --rebase origin main && git branch -d <stale-branch>
```

## Step 1 — Commit

1. `git status` + `git diff --stat HEAD` to see what changed
2. Check GitHub Issues for related backlog items: `gh issue list --repo YanCheng-go/danskprep --search "<keywords>" --state open --json number,title --limit 5`
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
- Closes #NNN (or "None")

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
| GitHub Issues | Close related BL-NNN issues via `Closes #NNN` in PR body (auto-closes on merge) |

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

## Step 7 — Merge and sync local (only on user approval)

1. **Merge main into PR branch first** — catch conflicts before merging to main:
   ```bash
   git fetch origin main && git merge origin/main
   ```
   If there are conflicts, resolve them, commit, push, and wait for CI to pass before continuing.
2. `gh pr checks <number>` — confirm CI passes (fix failures if any)
3. `gh pr merge <number> --squash --delete-branch` (deletes the remote branch)
4. Sync local main — **always do this immediately after merge**:
   ```bash
   git checkout main && git pull --rebase origin main
   ```
5. Delete the local branch to keep the workspace clean:
   ```bash
   git branch -d <branch>
   ```
6. Verify you're on an up-to-date main: `git log --oneline -3` should show the merge commit

**If the merge happened in a previous session** (e.g., merged via GitHub UI), still run step 3-5 to sync before starting new work.

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
