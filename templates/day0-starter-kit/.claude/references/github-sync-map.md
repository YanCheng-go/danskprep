---
globs:
  - ".github/**/*"
  - ".claude/skills/**/*"
  - ".claude/rules/**/*"
---

# GitHub Sync Map

Cross-reference between AI path (`.claude/`) and manual path (`.github/`).

<!-- CUSTOMIZE: Fill in your project's specific mappings -->

| Concern | AI Path (.claude/) | Manual Path (.github/) | Source of Truth |
|---------|-------------------|----------------------|----------------|
| PR format | `references/pr-templates.md` | `pull_request_template.md` | PR template |
| Branch naming | `rules/shipping-workflow.md` | `workflows/branch-name.yml` | Workflow |
| CI checks | `skills/commit/SKILL.md` Step 0 | `workflows/ci.yml` | Workflow |
| Issue creation | `skills/backlog/SKILL.md` | `ISSUE_TEMPLATE/*.yml` | Templates |
| Labels | `skills/backlog/SKILL.md` | `labels.yml` | `labels.yml` |
| Release flow | `skills/release/SKILL.md` | `workflows/release.yml` | Skill |
| Code ownership | `CLAUDE.md` | `CODEOWNERS` | `CODEOWNERS` |
| Dependencies | — | `dependabot.yml` | `dependabot.yml` |

## Verification

```bash
# Check labels in sync
diff <(yq '.[] | .name' .github/labels.yml | sort) <(gh label list --json name -q '.[].name' | sort)

# Check branch convention matches workflow
grep -o '"^[^"]*"' .github/workflows/branch-name.yml
```
