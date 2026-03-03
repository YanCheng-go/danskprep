---
name: daily
description: Daily session wrapper — start with backlog, work, simplify, commit, retro
user-invocable: true
---

# /daily — Daily Session Flow

A guided checklist for a productive session. Run at the start of a work session — it walks you through the full cycle.

| Invocation | Behaviour |
|---|---|
| `/daily` | Full session flow (start → work → ship → close) |
| `/daily start` | Just the opening steps (1–2) — see what's ready and pick work |
| `/daily wrap` | Just the closing steps (4–6) — simplify, commit, retro |

---

## Step 1 — Open: backlog dashboard

Run `/backlog` (dashboard mode) to show:
- Items currently In Progress
- Top 5 ready items by priority
- Any items blocked

Present a quick summary:
```
## Today's Board
🔵 In Progress: BL-012 (description), BL-018 (description)
⬜ Ready (top 3): BL-025 (p1/s), BL-031 (p2/xs), BL-014 (p2/m)
🔴 Blocked: none
```

## Step 2 — Pick work

Ask the user what they want to work on today:
1. **Continue** an in-progress item
2. **Start** one of the ready items (suggest the top pick from `/backlog next` scoring)
3. **Something else** — ad-hoc task (create a backlog item for it)

Once decided, set the item to in-progress:
```bash
gh project item-edit --project-id PVT_kwHOAtALr84BQs_6 --id <item_id> \
  --field-id PVTSSF_lAHOAtALr84BQs_6zg-vxHc --single-select-option-id 47fc9ee4
```

Then hand off to the user: "Ready to go. Work on the task, then run `/daily wrap` when you're done — or I'll remind you."

**STOP HERE and let the user work.** Do not proceed to Step 3 automatically.

---

## Step 3 — Work (user does this)

The user codes, tests, iterates. This step is implicit — the skill resumes at Step 4 when the user runs `/daily wrap` or asks to wrap up.

---

## Step 4 — Simplify

Run `/simplify` on all changed files:
1. `git diff --name-only` to find modified files
2. Review for: dead code, unused imports, over-engineering, duplication, missing types
3. Apply fixes if any
4. `npx tsc --noEmit` to verify no type errors introduced

If no changes were made, skip this step.

## Step 5 — Commit

Run `/commit` to ship changes:
- Branch, PR, self-review, fix, docs update
- Stops at human checkpoint for approval

If no uncommitted changes exist, skip this step.

## Step 6 — Retro

Run `/retro` to close out:
- Summarize what was done
- Update backlog statuses (done, in-progress, new discoveries)
- Append session log to NOTES.md
- Suggest next session priorities

---

## Rules

- Steps 1–2 run together at session start
- Steps 4–6 run together at session end
- Never skip the human checkpoint in `/commit` (Step 5)
- If the user only runs `/daily start`, stop after Step 2
- If the user only runs `/daily wrap`, start from Step 4
- Keep the opening dashboard concise — no more than 10 lines
