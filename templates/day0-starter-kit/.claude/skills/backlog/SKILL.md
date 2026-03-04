---
name: backlog
description: "Manage project backlog — add, list, filter, update, prioritize, suggest"
user-invocable: true
argument-hint: "<subcommand> [args]"
---

# /backlog — Backlog Management

<!-- CUSTOMIZE: Choose your backend (GitHub Projects, GitHub Issues, or file-based) -->
<!-- Wire up field IDs and project numbers before first use -->

## Subcommands

### `/backlog` or `/backlog dashboard`
Show overview: in-progress items, ready items, blocked items, stats.

### `/backlog add <title>`
Create a new backlog item with:
- Title (imperative: "Add X", "Fix Y")
- Type: feature / bug / chore / infra / content
- Priority: p0 (critical) / p1 (important) / p2 (default) / p3 (nice to have)
- Effort: xs / s / m / l / xl

### `/backlog list [filter]`
List items. Filters: `ready`, `in-progress`, `blocked`, `type:bug`, `priority:p0`, etc.

### `/backlog view <id>`
Show full details of a specific item.

### `/backlog update <id> <field=value>`
Update an item's status, priority, effort, or assignee.

### `/backlog done <id>`
Mark item as complete. Move to Done status.

### `/backlog next`
Suggest the next item to work on based on:
1. Priority (higher = first)
2. Effort (smaller = first for quick wins)
3. Blocked status (skip blocked items)
4. Context (recently touched files)

### `/backlog prioritize`
Review all open items and re-rank by priority.
