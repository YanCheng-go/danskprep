---
name: commit
description: Commit changes, create PR, self-review, fix issues, and merge — full ship cycle
user-invocable: true
---

# /commit — Ship Cycle

Commit current changes and run the full ship cycle: branch, PR, self-review, fix, merge.

**Never push directly to main.** Every change goes through a PR.

## Arguments

| Invocation | Behaviour |
|---|---|
| `/commit` | Auto-detect changes, run full cycle |
| `/commit <message>` | Use provided message as commit summary |

---

## Step 1 — Prepare the commit

1. Run `git status` and `git diff --stat HEAD` to understand what changed
2. Check for related backlog items in `docs/backlog.md` — scan titles/descriptions for keywords matching the changed files or feature area
3. Draft a commit message:
   - First line: imperative, under 70 chars, explains *why* not *what*
   - If user provided a message, use it as the basis
   - End with `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
4. Stage relevant files (`git add <specific files>` — never `git add -A`)
   - Skip files that contain secrets (`.env`, credentials)
   - Skip unrelated uncommitted changes from other sessions
5. Create the commit

## Step 2 — Create a branch and PR

1. Create a branch from current position: `git checkout -b <type>/<short-description>`
   - Types: `fix/`, `feat/`, `docs/`, `chore/`, `refactor/`
2. Switch GitHub auth: `gh auth switch --user YanCheng-go`
3. Push: `git push -u origin <branch>`
4. Create PR with `gh pr create`:

```bash
gh pr create --title "<short title>" --body "$(cat <<'EOF'
## Summary
- What changed and why

## Backlog
- Relates to: BL-NNN (or "No related backlog items")

## Test plan
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] `npx vitest run` — all tests pass
- [ ] Manually verified: <description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Backlog reference**: If a backlog item is related, include `Relates to: BL-NNN` or `Closes: BL-NNN` (if fully resolved) in the PR body.

## Step 3 — Self-review

After the PR is created, perform a fresh review of the changes:

1. Run `gh pr diff <number>` to see the full diff as a reviewer would
2. Check for:
   - **Errors**: unused imports, type issues, missing null checks, broken logic
   - **Suggestions**: simpler approaches, redundant code, naming improvements
   - **Trade-offs**: document any compromises made (performance vs readability, etc.)
   - **Regressions**: does this break existing behaviour?
   - **Convention violations**: check against CLAUDE.md and `.claude/rules/`
3. Report findings to the user:
   ```
   ## Self-review — PR #NN

   ### Errors (must fix)
   - ...

   ### Suggestions (nice to have)
   - ...

   ### Trade-offs
   - ...

   ### Verdict: Clean / Needs fixes
   ```

## Step 4 — Fix issues (if any)

If the self-review found errors:

1. Fix all errors on the **same branch**
2. Stage and commit the fixes: `fix: address review findings`
3. Push: `git push`
4. Re-run verification: `npx tsc --noEmit && npm run build && npx vitest run`

If the self-review is clean, skip to Step 5.

## Step 5 — Wait for CI and merge

1. Poll CI status: `gh pr checks <number>`
   - If CI fails, read the failure logs, fix, push, and re-check
2. Once CI passes, merge: `gh pr merge <number> --squash --delete-branch`
3. Sync local main: `git checkout main && git stash && git pull --rebase && git stash pop`

## Step 6 — Update backlog (if applicable)

If the PR relates to a backlog item:

1. Read `docs/backlog.md`
2. If the item is fully resolved: update status to `done`, append note with today's date
3. If partially addressed: append a note describing what was done
4. Update the header counts
5. Commit the backlog update in a follow-up (or include in the same PR if not yet merged)

---

## Quick mode

For trivial changes (typo, single-line fix, docs-only):
- Skip Step 3 (self-review) if the diff is under 20 lines and docs-only
- Still create a PR — never push to main

## Rules

- **Never push to main** — always go through a PR
- **Never skip CI** — wait for checks to pass before merging
- **Never use `--no-verify`** — if hooks fail, fix the underlying issue
- **Clean up unused imports** in the same edit, not as a follow-up
- **One concern per commit** — if fixing multiple unrelated things, make separate commits
