# GitHub Sync Rule

## Dual-Path Development

This project has two development paths that must stay in sync:
- **AI path:** `.claude/` (skills, rules, references, agents)
- **Manual path:** `.github/` (workflows, templates, labels, CODEOWNERS)

## When editing paired files

When editing any skill, rule, or reference that has a `.github/` counterpart, update both in the same commit.

See `.claude/references/github-sync-map.md` for the full mapping table.

## When creating new skills

Ask before creating a GitHub workflow equivalent:

```
This skill does X. A GitHub workflow could enforce/automate part of this for manual contributors:
- Workflow: <what it would do>
- Trigger: <when it would run>

Want me to create it?
```

If confirmed, create the workflow and add both to the sync map.
