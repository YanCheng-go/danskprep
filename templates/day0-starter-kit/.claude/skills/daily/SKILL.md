---
name: daily
description: "Daily session wrapper — start with backlog, work, commit, retro"
user-invocable: true
argument-hint: "[start|wrap]"
---

# /daily — Daily Session Workflow

## `/daily` or `/daily start` — Begin Session

### Step 1: Backlog Dashboard
Run `/backlog` to show current state: in-progress, ready, blocked items.

### Step 2: Pick Work
Run `/backlog next` to suggest highest-priority ready item.
Present to user for confirmation.

### STOP
User works on the selected item. Resume with `/daily wrap` when done.

## `/daily wrap` — End Session

### Step 3: Ship
Run `/commit` to ship completed work (includes self-review, CI, human approval).

### Step 4: Retrospective
Run `/retro` to summarize session, update backlog, suggest next priorities.
