---
name: release
description: "Cut a versioned release — changelog, version bump, release PR"
user-invocable: true
argument-hint: "[major|minor|patch]"
---

# /release — Cut a Release

## Prerequisites
- On `main` branch, fully up to date
- All CI checks passing
- At least one meaningful change since last release

## Steps

### Step 1: Assess Changes
1. `git log v{last}..HEAD --oneline` — list all commits since last tag
2. Categorize: features, fixes, chores, content, breaking changes
3. Determine version bump:
   - **major** — breaking changes
   - **minor** — new features
   - **patch** — bug fixes, content updates, chores

### Step 2: Update Changelog
<!-- CUSTOMIZE: Define where your changelog lives (ONE place) -->
1. Add entry to changelog with: version, date, highlights, stats
2. Keep entries concise (3-5 bullet points per release)

### Step 3: Bump Version
<!-- CUSTOMIZE: Define the SINGLE source of truth for version -->
1. Update version in `package.json`
2. If version appears elsewhere, update from this single source

### Step 4: Create Release PR
1. Branch: `release/vX.Y.Z`
2. PR title: `release: vX.Y.Z — short description`
3. PR body: changelog entry + release checklist

### Step 5: HUMAN CHECKPOINT
**STOP.** Present PR for review. Wait for approval.

### Step 6: Merge + Tag
1. Merge release PR
2. CI auto-creates GitHub Release (if workflow configured)
3. Verify deployment
