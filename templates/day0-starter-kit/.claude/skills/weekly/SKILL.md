---
name: weekly
description: "Weekly review — prioritize backlog, review progress, release check, plan ahead"
user-invocable: true
argument-hint: "[review|plan]"
---

# /weekly — Weekly Review

## `/weekly` or `/weekly review` — Full Review

### Step 1: Week in Review
- `git log --oneline --since="7 days ago"` — all commits this week
- `gh pr list --state merged --search "merged:>YYYY-MM-DD"` — merged PRs
- Summarize: features shipped, bugs fixed, infrastructure changes

### Step 2: Backlog Health Check
- **Stale in-progress:** items in-progress > 7 days without commits → flag
- **P3 accumulation:** if > 10 p3 items → suggest review or bulk-close
- **Ideas review:** scan `status:idea` items → promote or archive
- **Missing metadata:** items without priority, effort, or area labels

### Step 3: Prioritize
Run `/backlog prioritize` — re-rank all open items.

### Step 4: Release Check
- Count changes since last tag
- If meaningful changes exist → suggest `/release`
- If not → note "no release needed"

### Step 5: Plan the Week
Output a MoSCoW plan:
- **Must:** highest priority, blocking others
- **Should:** important but not blocking
- **Could:** nice to have if time allows
- **Blocked:** needs external input or dependency resolution
