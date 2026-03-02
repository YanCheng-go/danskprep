---
name: release
description: Orchestrate a release — changelog, build verification, PR creation, and GitHub release notes
user-invocable: true
---

# /release — Ship a Release

## When to use

When a batch of work is ready to ship. This skill chains together the release checklist: update the changelog, verify the build, create a PR, and draft GitHub release notes.

## Prerequisites

Before running this skill:
- All feature work is committed on a feature branch (not `main`)
- Tests pass locally
- No uncommitted changes

If any prerequisite fails, stop and tell the user what needs fixing.

## Steps

### Step 1 — Assess what's being released

1. Run `git log --oneline main..HEAD` to see all commits on this branch
2. Run `git diff --stat main..HEAD` to see all files changed
3. Read `docs/backlog.md` to identify which backlog items are addressed
4. Categorize changes:
   - **Features** — new user-facing functionality
   - **Fixes** — bug fixes
   - **Content** — new exercises, words, grammar topics
   - **Infrastructure** — tooling, CI, build changes
   - **Chores** — refactoring, cleanup

Present the summary to the user and confirm this is what should be released.

### Step 2 — Update changelog

Run the `/update-changelog` skill logic:

1. Read `src/data/seed/changelog.json`
2. Determine version bump:
   - **Patch** (0.0.x) — bug fixes only
   - **Minor** (0.x.0) — new features or content
   - **Major** (x.0.0) — breaking changes (rare)
3. Count current content:
   ```bash
   python3 -c "import json; print(len(json.load(open('src/data/seed/exercises-pd3m2.json'))))"
   python3 -c "import json; print(len(json.load(open('src/data/seed/words-pd3m2.json'))))"
   ```
4. Write the new changelog entry at the TOP of the array
5. Sync version in all three places:
   - `src/data/seed/changelog.json` → latest entry `version`
   - `src/lib/constants.ts` → `APP_VERSION`
   - `package.json` → `version`
6. Confirm the version bump with the user before writing

### Step 3 — Verify build

Run all checks — stop if any fail:

```bash
npx tsc --noEmit          # TypeScript clean
npm run lint              # No lint errors
npm test                  # All tests pass
npm run build             # Production build succeeds
```

If a check fails, fix the issue and re-run. Do not proceed to PR creation with failing checks.

### Step 4 — Update documentation

Follow the `/commit` skill's documentation checklist:

1. **NOTES.md** — add session log entry under Completed, check off done items
2. **docs/backlog.md** — mark completed items as done via `/backlog done BL-NNN`
3. **README.md** — update if roadmap, commands, or stack changed

### Step 5 — Commit release changes

Stage and commit the changelog + version bump + documentation updates:

```bash
git add src/data/seed/changelog.json src/lib/constants.ts package.json NOTES.md docs/backlog.md README.md
git commit -m "$(cat <<'EOF'
chore: bump version to X.Y.Z, update changelog

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Only stage files that were actually modified. Do not use `git add -A`.

### Step 6 — Create the PR

```bash
gh pr create --title "release: vX.Y.Z — <short description>" --body "$(cat <<'EOF'
## Summary
- <3-5 bullet points of user-facing changes>

## Release checklist
- [x] Changelog updated (`src/data/seed/changelog.json`)
- [x] Version synced (changelog, constants.ts, package.json)
- [x] `npx tsc --noEmit` passes
- [x] `npm test` passes
- [x] `npm run build` succeeds
- [x] NOTES.md session log updated
- [x] Backlog items marked done

## Content stats
- Exercises: N
- Words: N
- Grammar topics: N

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 7 — Draft GitHub release notes

After the PR is created, prepare release notes for after merge:

```bash
gh release create vX.Y.Z --draft --title "vX.Y.Z — <short description>" --notes "$(cat <<'EOF'
## What's New

- <user-facing highlights, 3-8 bullets>

## Content
- N exercises, N words, N grammar topics

## Full Changelog
https://github.com/YanCheng-go/danskprep/compare/vPREV...vX.Y.Z
EOF
)"
```

Tell the user: "Draft release created. After merging the PR, publish the release from GitHub."

### Step 8 — Final summary

Output:
```
## Release vX.Y.Z ready

- PR: <PR URL>
- Draft release: <release URL>
- Version: X.Y.Z (synced in 3 places)
- Changelog: N highlights
- Backlog items closed: BL-NNN, BL-NNN

Next: merge the PR, then publish the draft release on GitHub.
```

## Rules

- Always confirm the version bump with the user before writing
- Never skip the build verification step — failing builds must be fixed first
- Always switch to the correct GitHub account first: `gh auth switch --user YanCheng-go`
- Never force-push or push directly to main
- The draft release is created but NOT published — the user publishes after merge
- If there are no user-facing changes, skip the changelog and just create a maintenance PR
- Co-author line on all commits: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

## Troubleshooting

| Problem | Fix |
|---|---|
| `gh: not authenticated` | Run `gh auth switch --user YanCheng-go` |
| Version mismatch between 3 files | Re-read all three, fix the one that's wrong |
| Build fails on type errors | Run `npx tsc --noEmit` to see the errors, fix them |
| PR creation fails | Check branch is pushed: `git push -u origin <branch>` |
