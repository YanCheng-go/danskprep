---
globs:
  - ".github/pull_request_template.md"
  - ".claude/skills/commit/**"
  - ".claude/skills/release/**"
---

# PR Templates

## Standard PR (used by `/commit`)

```bash
gh pr create --title "type: short description" --body "$(cat <<'EOF'
## Summary
- What changed and why (2-4 bullets)

## Backlog
- Closes #NNN
- None

## Test plan
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] Manual smoke test

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Release PR (used by `/release`)

```bash
gh pr create --title "release: vX.Y.Z — short description" --body "$(cat <<'EOF'
## Summary
- Version bump to X.Y.Z
- Changelog updated

## Release checklist
- [ ] Version synced across all locations
- [ ] Changelog entry added
- [ ] CI passing
- [ ] Build verified

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Rules
- Always use HEREDOC for PR body (avoids shell escaping issues)
- Link issues with `Closes #NNN` for auto-close on merge
