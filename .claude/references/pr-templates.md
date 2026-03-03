# PR Body Templates

## Standard PR (used by `/commit`)

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
- What and why

## Backlog
- Closes #NNN <!-- BL-NNN: title --> (or "None")

## Test plan
- [ ] `npx tsc --noEmit` + `npm run build` + `npx vitest run`
- [ ] Manually verified: <description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Release PR (used by `/release`)

```bash
gh pr create --title "release: vX.Y.Z — <short description>" --body "$(cat <<'EOF'
## Summary
- <3-5 bullet points summarizing changes since last release>

## Backlog
- Closes #NNN <!-- BL-NNN: title -->
- (list all backlog items addressed in this release, or "None")

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

## Rules

- **Always use `#NNN`** (GitHub issue number) for backlog references — GitHub auto-links these
- **Add BL-NNN in an HTML comment** for human context: `Closes #77 <!-- BL-037: Change search placeholder -->`
- **Look up issue number** from BL label: `gh issue list --repo YanCheng-go/danskprep --search "BL-NNN" --json number,title --limit 5`
- **Multiple items**: list each on its own line with `Closes #NNN`
- **Use HEREDOC** (`cat <<'EOF'`) to avoid shell escaping issues
