# Pull Request

Create a pull request and ensure all project documentation is up to date with the changes being merged.

## Instructions

When the user asks to create a PR (or when wrapping up a session of changes), follow this checklist **before** creating the PR.

---

### Step 1 — Update NOTES.md

`NOTES.md` is the persistent todo/tracking file at the project root. Update it to reflect what was done and what remains:

1. **Check off completed items** — mark `- [ ]` → `- [x]` for everything implemented in this PR
2. **Add new items** — if new issues or improvement opportunities were discovered, add them under the appropriate priority section
3. **Add a session log entry** at the bottom of "Completed This Session":
   ```markdown
   - [x] Brief description of what was done *(done YYYY-MM-DD)*
   ```
4. **Update "Next Session Priorities"** — reorder based on what's now most important

### Step 2 — Update README.md

Check whether any of these sections need updating:

| Section | Update if… |
|---------|-----------|
| Live app URL | Deployment URL changed |
| Stack table | New dependency added (npm or Python) |
| Commands table | New `npm run` script or `uv run` command added |
| Data Enrichment section | New scraper added or scraper usage changed |
| Roadmap — ✅ completed items | New features shipped |
| Roadmap — 🔜 next items | Priorities shifted |
| Content Scope table | New module added or status changed |
| Analytics badge | Badge URL updated |

### Step 3 — Update reference files (if scraping-related)

If the PR touches any scraper scripts (`scripts/scrape-*.py`):
- Update `references/{site}.md` with any new findings about site structure
- Update exercise type mappings if new H5P/exercise types were discovered
- Note new cookie refresh procedures if auth flow changed

### Step 4 — Verify build passes

```bash
# TypeScript must be clean
npx tsc --noEmit

# Tests must pass
npm test

# No lint errors
npm run lint
```

Do not create the PR if any of these fail.

### Step 5 — Create the PR

Use the standard PR format:

```bash
gh pr create --title "short title under 70 chars" --body "$(cat <<'EOF'
## Summary
- Bullet 1: what changed and why
- Bullet 2: ...

## Documentation updated
- [ ] NOTES.md — checked off completed items, added new todos
- [ ] README.md — updated roadmap / commands / stack
- [ ] references/*.md — updated if scraping-related

## Test plan
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes
- [ ] Manually verified: [describe what you tested]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Quick mode (small fixes)

For tiny PRs (typo fix, single-file change), the documentation update can be minimal:
- Still check off any NOTES.md items that are now done
- Skip README.md update if nothing user-facing changed
- Skip reference update if no scraping code changed

## Reminders

- Never force-push to `main`
- Commit messages should explain *why*, not just *what*
- Co-author line: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- If the PR adds a new Python dependency: confirm it's in `scripts/pyproject.toml`, not installed ad-hoc with pip
- If the PR adds a new npm dependency: confirm it's in the right section (`dependencies` vs `devDependencies`)
