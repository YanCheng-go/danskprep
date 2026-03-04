---
name: retro
description: "End-of-session retrospective — summarize work, update backlog, plan next"
user-invocable: true
---

# /retro — Session Retrospective

## Steps

### Step 1: Gather Context
1. `git log --oneline --since="8 hours ago"` — what was committed this session
2. `git diff --stat HEAD~N` — scope of changes
3. Review any open PRs from this session

### Step 2: Categorize Work
- **Done:** items fully completed and merged
- **In progress:** items started but not finished
- **Discovered:** new issues found during work
- **Blocked:** items that can't proceed (and why)

### Step 3: Update Backlog
- Mark completed items as done (`/backlog done`)
- Add newly discovered items (`/backlog add`)
- Update blocked items with blocker info

### Step 4: Write Summary
```markdown
## Session — YYYY-MM-DD

### Done
- [item]: [one-line description of what was accomplished]

### In Progress
- [item]: [what remains]

### Discovered
- [new issue]: [brief description]

### Blocked
- [item]: blocked by [reason]

### Stats
- Commits: N
- Files changed: N
- Lines: +N / -N
```

### Step 5: Suggest Next Priorities
Based on current state, suggest 2-3 items for the next session.

## Rules
- Never fabricate work — only report what actually happened
- Keep summaries concise (1 line per item)
- If nothing was accomplished, say so honestly
