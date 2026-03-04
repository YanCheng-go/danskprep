---
name: update-changelog
description: "Add a new changelog entry, bump version, verify build"
user-invocable: true
argument-hint: "[major|minor|patch]"
---

# /update-changelog — Changelog & Version Bump

<!-- CUSTOMIZE: Set your changelog location and version source of truth -->

## Steps

### Step 1: Read Current State
- Read changelog file
- Read current version from `package.json`
- `git log v{last-tag}..HEAD --oneline` — changes since last release

### Step 2: Summarize Highlights
Categorize changes:
- **Features:** new user-facing functionality
- **Fixes:** bug fixes
- **Content:** data/content additions (if applicable)
- **Infrastructure:** CI/CD, tooling, dependencies

Write 3-5 bullet point highlights (user-facing language, not commit messages).

### Step 3: Determine Version Bump
- **major** — breaking changes
- **minor** — new features (default if features present)
- **patch** — bug fixes, content, chores only

### Step 4: Update Files
1. Add changelog entry (newest first)
2. Bump version in `package.json`
<!-- CUSTOMIZE: Add any other files where version appears -->

### Step 5: Verify
```bash
npx tsc --noEmit && npm run build
```

## Rules
- Changelog entries are written for USERS, not developers
- Use past tense ("Added X", "Fixed Y")
- Keep entries concise — 1 line per change
- **One source of truth for version** — `package.json` is canonical
