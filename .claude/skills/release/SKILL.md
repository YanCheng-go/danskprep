---
name: release
description: Cut a versioned release — assess changes since last tag, changelog, version bump, release PR
user-invocable: true
---

# /release — Cut a Release

## When to use

When multiple PRs have been merged to `main` and you're ready to cut a versioned release. This skill looks at everything since the last release tag, creates a changelog entry, bumps the version, and opens a small release PR.

## Prerequisites

- You are on `main` with a clean working tree (`git status` shows no changes)
- One or more PRs have been merged since the last release tag
- `gh auth switch --user YanCheng-go` has been run

If any prerequisite fails, stop and tell the user what needs fixing.

## Steps

### Step 1 — Assess what's being released

1. Find the last release tag:
   ```bash
   LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
   ```
2. List changes since that tag (or all commits if no tag exists):
   ```bash
   git log --oneline ${LAST_TAG:+$LAST_TAG..HEAD}
   git diff --stat ${LAST_TAG:+$LAST_TAG..HEAD}
   ```
3. Read `docs/backlog.md` to identify which backlog items are addressed
4. Categorize changes:
   - **Features** — new user-facing functionality
   - **Fixes** — bug fixes
   - **Content** — new exercises, words, grammar topics
   - **Infrastructure** — tooling, CI, build changes
   - **Chores** — refactoring, cleanup

Present the summary to the user and confirm this is what should be released.

### Step 2 — Create release branch

```bash
git checkout -b release/vX.Y.Z
```

### Step 3 — Update changelog and version

Run `/update-changelog` to create the changelog entry, bump the version, and sync all three locations (changelog.json, constants.ts, package.json).

Pass the last release tag so it knows the correct range of changes to summarize.

Confirm the version bump with the user before writing.

### Step 4 — Update documentation

Checklist — update each file **only if changes since last release make it stale**:

| Doc | When to update |
|-----|---------------|
| `README.md` | Content counts, Roadmap checkboxes, Features list, Stack |
| `NOTES.md` | Check off completed items, remove stale todos |
| `docs/backlog.md` | Mark related BL-NNN items as `done`, update header counts |

**Do not update a doc if the release doesn't affect it.**

### Step 5 — Verify build

Run all checks — stop if any fail:

```bash
npx tsc --noEmit          # TypeScript clean
npm run lint              # No lint errors
npm test                  # All tests pass
npm run build             # Production build succeeds
```

If a check fails, fix the issue and re-run. Do not proceed with a broken build.

### Step 6 — Commit and push

```bash
git add src/data/seed/changelog.json src/lib/constants.ts package.json
# Also stage any docs that were actually updated:
# git add README.md NOTES.md docs/backlog.md
git commit -m "$(cat <<'EOF'
chore: release vX.Y.Z

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
git push -u origin release/vX.Y.Z
```

Only stage files that were actually modified. Do not use `git add -A`.

### Step 7 — Create the PR

```bash
gh pr create --title "release: vX.Y.Z — <short description>" --body "$(cat <<'EOF'
## Summary
- <3-5 bullet points summarizing changes since last release>

## Release checklist
- [x] Changelog updated (`src/data/seed/changelog.json`)
- [x] Version synced (changelog, constants.ts, package.json)
- [x] `npx tsc --noEmit` passes
- [x] `npm test` passes
- [x] `npm run build` succeeds

## Content stats
- Exercises: N
- Words: N
- Grammar topics: N

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 8 — Human checkpoint ⛔

**STOP HERE.** Present the summary and wait for the user to decide:

```
## Release vX.Y.Z ready for review

- PR: <PR URL>
- Branch: release/vX.Y.Z
- Version: X.Y.Z (synced in 3 places)
- Changes since last release: N commits across M PRs
- Changelog: N highlights

Please review the PR. Reply with:
- "merge" — to squash-merge (CI will auto-create the GitHub release)
- "fix <issue>" — to address something first
```

**Do NOT merge unless the user explicitly approves.**

### Step 9 — Merge (only on user approval)

1. `gh pr checks <number>` — confirm CI passes
2. `gh pr merge <number> --squash --delete-branch`
3. `git checkout main && git pull --rebase`
4. `git branch -d release/vX.Y.Z`

CI will auto-create the GitHub release from the version in `package.json`.

## Rules

- Always confirm the version bump with the user before writing
- Never skip the build verification step
- Always switch to the correct GitHub account first: `gh auth switch --user YanCheng-go`
- Never force-push or push directly to main
- **Never merge without user approval** — always stop at Step 8
- CI auto-creates the GitHub release after merge — no manual draft needed
- If there are no user-facing changes, skip the changelog and create a maintenance PR instead
- Co-author line on all commits: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

## Troubleshooting

| Problem | Fix |
|---|---|
| No release tag exists yet | Use full git log; `/update-changelog` handles this gracefully |
| `gh: not authenticated` | Run `gh auth switch --user YanCheng-go` |
| Version mismatch between 3 files | Re-read all three, fix the one that's wrong |
| Build fails on type errors | Run `npx tsc --noEmit` to see the errors, fix them |
| PR creation fails | Check branch is pushed: `git push -u origin release/vX.Y.Z` |
