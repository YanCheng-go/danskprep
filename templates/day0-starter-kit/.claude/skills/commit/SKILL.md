---
name: commit
description: "Full ship cycle: branch, PR, self-review, fix, human approval, merge"
user-invocable: true
argument-hint: "[commit message]"
---

# /commit — Ship Code

## Steps

### Step 0: Pre-flight
1. Run `git status` — ensure working tree is clean except for intended changes
2. Run `git pull origin main` — ensure branch is up to date
3. Run quality gates: `npx tsc --noEmit && npm run lint && npm test -- --run && npm run build`
4. If any gate fails → fix before proceeding

### Step 1: Commit
1. Stage relevant files (never `git add -A` — be explicit)
2. Write commit message explaining WHY, not WHAT
3. Format: `type: description` (e.g., `feat: add quiz length selector`)

### Step 2: Branch + Push
1. Create branch if not on one: `git checkout -b {type}/{slug}`
2. Push: `git push -u origin {branch}`

### Step 3: Create PR
1. Write summary (2-4 bullet points)
2. Reference backlog items (`Closes #NNN`)
3. Add test checklist

### Step 4: Self-Review
1. Read the full diff as if reviewing someone else's code
2. Check for: unused imports, missing error handling, a11y, mobile
3. Fix any issues found, commit, push

### Step 5: Wait for CI
1. All checks must pass before proceeding

### Step 6: Update Docs (if needed)
- [ ] README updated if user-facing behavior changed
- [ ] CLAUDE.md updated if conventions changed

### Step 7: HUMAN CHECKPOINT
**STOP HERE.** Present the PR URL to the user and wait for explicit approval before merging. Never auto-merge.

### Step 8: Merge + Cleanup
1. Squash-merge into main
2. Delete the feature branch (local + remote)
3. Update backlog status if applicable
