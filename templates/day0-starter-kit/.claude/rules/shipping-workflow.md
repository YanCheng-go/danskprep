# Shipping Workflow

## The Complete Flow (Design Once, Don't Iterate)

```
1. Pre-flight     — ensure main is up to date, no uncommitted changes
2. Commit         — stage changes, write commit message (why, not what)
3. Branch + PR    — create feature branch, push, open PR
4. Self-review    — read the diff as a reviewer would, fix issues
5. CI             — wait for all checks to pass
6. Docs           — update README/docs if user-facing behavior changed
7. Human approval — STOP and wait for human to approve
8. Merge          — squash-merge into main
9. Cleanup        — delete branch, update backlog status
```

## Rules

- Never push directly to main
- Never merge without passing CI + human approval
- Never auto-merge without explicit user permission
- Never amend published commits — create new ones
- Never skip pre-commit hooks (`--no-verify`)
- Commit messages explain WHY, not WHAT

## Branch Naming

```
fix/description      — bug fixes
feat/description     — new features
docs/description     — documentation only
chore/description    — refactoring, cleanup, tooling
refactor/description — code restructuring
release/vX.Y.Z      — release branches
```

## PR Body

Always include:
1. Summary (2-4 bullet points)
2. Backlog references (`Closes #NNN`)
3. Test checklist
