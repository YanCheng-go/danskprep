---
name: retro
description: End-of-session retrospective — summarize work done, update backlog statuses, append session log
user-invocable: true
---

# /retro — Session Retrospective

## When to use

Run at the end of a working session, before you stop for the day. Captures what was accomplished, updates backlog item statuses, and appends a session log entry to NOTES.md.

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

### Step 4 — Write session summary

Present a summary to the user in this format:

```
## Session Retro — YYYY-MM-DD

### Done
- [x] BL-001: Description of what was completed
- [x] BL-005: Description of what was completed

### In Progress
- [ ] BL-003: What was started, what remains

### Discovered
- New: <description of new item added>
- Bug: <description of bug found>

### Blocked
- BL-007: Blocked on <reason>

### Stats
- Commits: N
- Files changed: N
- Items completed: N
- Items added: N
```

### Step 5 — Append to NOTES.md

Add a session log entry under the `## Completed` section in `NOTES.md`:

```markdown
### Session YYYY-MM-DD — <short theme> (branch: <current-branch>)
- [x] Item 1 description
- [x] Item 2 description
- [ ] Item 3 — in progress, <what remains>
```

Use the existing session log format in NOTES.md (look at previous entries for style).

### Step 6 — Suggest next session priorities

Based on the current backlog state, suggest what to work on next:
1. Run the `/backlog next` logic (priority + effort + context scoring)
2. Mention any items that were unblocked by today's work
3. Flag any approaching deadlines or dependencies

## Rules

- Never fabricate work that wasn't done — only log what actually happened this session
- Use the conversation history as the primary source of truth, git log as confirmation
- Keep session summaries concise — 5-15 bullet points, not paragraphs
- If no backlog items exist yet, still write the NOTES.md session log
- Always show the summary to the user before writing to files
- Date is always today's date
