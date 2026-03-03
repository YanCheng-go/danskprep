---
name: update-changelog
description: Add a new changelog entry, bump version, sync all three locations
user-invocable: true
---

# /update-changelog — Add a new changelog entry

## When to use
Called by `/release` (or standalone) to summarize changes into `src/data/seed/changelog.json`, bump the version, and sync all three version locations.

## Steps

1. **Read current changelog**: `src/data/seed/changelog.json`
2. **Review changes since last release**:
   ```bash
   LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
   git log --oneline ${LAST_TAG:+$LAST_TAG..HEAD}
   ```
   If no tag exists, review the full log: `git log --oneline -30`
3. **Summarize highlights**: 3-8 bullet points describing user-facing changes
4. **Determine version**: bump patch for fixes, minor for features, major for breaking
5. **Count content**:
   ```bash
   python3 -c "import json; print(len(json.load(open('src/data/seed/exercises-pd3m2.json'))))"
   python3 -c "import json; print(len(json.load(open('src/data/seed/words-pd3m2.json'))))"
   ```
6. **Add entry** at the TOP of the array in `changelog.json`:
   ```json
   {
     "version": "X.Y.Z",
     "date": "YYYY-MM-DD",
     "title": "Short descriptive title",
     "highlights": ["...", "..."],
     "stats": { "exercises": N, "words": N, "grammar_topics": 6 }
   }
   ```
7. **Sync version in all three places** (must match):
   - `src/data/seed/changelog.json` → latest entry `version`
   - `src/lib/constants.ts` → `APP_VERSION`
   - `package.json` → `version`
8. **Verify**: `npx tsc --noEmit && npm run build`

## Rules
- Date is always today's date
- Stats must be actual current counts, not estimates
- Highlights should be user-facing (no "refactored X" unless it changes UX)
- Keep title under 50 chars
- **Version must be synced** in changelog.json, constants.ts, and package.json
