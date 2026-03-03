# GitHub Sync Rule

## Updating existing pairs

When editing any skill, reference, or rule that has a paired `.github/` file, **also update the GitHub counterpart** in the same commit.

See `.claude/references/github-sync-map.md` for the full mapping table.

Common cases:
- Changing PR template format → update `.github/pull_request_template.md`
- Adding a label to `/backlog` → update `.github/labels.yml` + `ISSUE_TEMPLATE/*.yml`
- Changing branch naming in `/commit` → update `.github/workflows/branch-name.yml`

## Creating new skills

When creating a new skill, always check: **does this skill have a GitHub workflow equivalent that would help manual contributors?**

Ask the user before creating one. Format:

```
This skill does X. A GitHub workflow could enforce/automate part of this for manual contributors:
- Workflow: <what it would do>
- Trigger: <when it would run>

Want me to create it?
```

If the user confirms, create the workflow and add both to the sync map.
