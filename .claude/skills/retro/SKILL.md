---
name: retro
description: End-of-session retrospective — summarize work, update backlog statuses, update MEMORY.md
user-invocable: true
---

# /retro — Session Retrospective

## When to use

Run at the end of a working session. Captures what was accomplished, updates backlog statuses, and persists key decisions to MEMORY.md.

## Steps

### Step 1 — Gather session context

1. Review the conversation history to identify all work completed this session
2. Run `git log --oneline -20` to see commits made
3. Run `git diff --stat HEAD~10` to see files changed
4. Check current backlog statuses: `gh project item-list 15 --owner YanCheng-go --format json --limit 200`

### Step 2 — Identify completed and progressed items

From the session work, determine:
- **Completed items** — backlog items fully done (all acceptance criteria met)
- **Progressed items** — items partially worked on (started but not finished)
- **New discoveries** — bugs found, new ideas surfaced, blockers identified
- **Blocked items** — items that can't proceed and why

### Step 3 — Update backlog statuses

For each affected backlog item:
- Completed → run `/backlog done BL-NNN` (closes the GitHub Issue)
- Started but not finished → run `/backlog update BL-NNN status=in-progress`
- New items discovered → run `/backlog add <description>` for each (creates a GitHub Issue)

If the backlog is empty (not yet imported), skip this step and note it.

### Step 4 — Update MEMORY.md

Review the session for decisions or patterns that should persist across conversations:
- New conventions or workflow changes confirmed
- User preferences expressed
- Architectural decisions made
- Updated counts, versions, or statuses

Update MEMORY.md only if something changed. Don't add session-specific context.

### Step 5 — Write session summary

Present a summary to the user:

```
## Session Retro — YYYY-MM-DD

### Done
- [x] BL-001: Description of what was completed

### In Progress
- [ ] BL-003: What was started, what remains

### Discovered
- New: <description of new item added>

### Blocked
- BL-007: Blocked on <reason>

### Stats
- Commits: N
- Items completed: N
- Items added: N
```

### Step 6 — Suggest next session priorities

Based on the current backlog state, suggest what to work on next:
1. Run the `/backlog next` logic (priority + effort + context scoring)
2. Mention any items that were unblocked by today's work
3. Flag any approaching deadlines or dependencies

## Rules

- Never fabricate work that wasn't done — only log what actually happened this session
- Use the conversation history as the primary source of truth, git log as confirmation
- Keep session summaries concise — 5-15 bullet points, not paragraphs
- Always show the summary to the user before writing to files
- Date is always today's date
- Do NOT append to NOTES.md — git history is the session log
