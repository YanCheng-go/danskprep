---
name: weekly
description: Weekly review — prioritize backlog, review progress, release check, plan ahead
user-invocable: true
---

# /weekly — Weekly Review

Run once a week (ideally Monday) to review progress, clean up the backlog, and plan the week ahead.

| Invocation | Behaviour |
|---|---|
| `/weekly` | Full weekly review (all steps) |
| `/weekly review` | Steps 1–3 only — review and prioritize |
| `/weekly plan` | Steps 4–5 only — release check and week plan |

---

## Step 1 — Week in review

Gather what happened since last week:
1. `git log --oneline --since="7 days ago"` — commits this week
2. `gh pr list --repo YanCheng-go/danskprep --state merged --search "merged:>=$(date -v-7d +%Y-%m-%d)" --json title,number,mergedAt --limit 20` — merged PRs
3. `gh issue list --repo YanCheng-go/danskprep --state closed --search "closed:>=$(date -v-7d +%Y-%m-%d)" --json title,number --limit 20` — closed issues

Present a summary:
```
## Week of YYYY-MM-DD

### Shipped
- PR #42: BL-012 — Quiz timer feature
- PR #43: BL-018 — Fix mobile layout

### Closed
- BL-012, BL-018, BL-025 (3 items completed)

### Stats
- Commits: N | PRs merged: N | Issues closed: N
```

## Step 2 — Backlog health check

Fetch all open items and review:
1. **Stale in-progress** — items marked In Progress for 7+ days without commits. Ask: still working on this, or should it go back to ready?
2. **p3 accumulation** — if more than 10 p3 items exist, suggest dropping or promoting some
3. **Idea review** — list all items with `status:idea` label. Ask: promote any to ready?
4. **Missing metadata** — items without priority, effort, or scope set

Present findings and ask the user for decisions on each.

## Step 3 — Prioritize

Run `/backlog prioritize` logic:
1. Group open items by priority (p0 → p3)
2. Within each priority, sort by effort (xs first for quick wins)
3. Ask the user:
   - Any items to promote (e.g., p3 → p2)?
   - Any items to drop?
   - Any new items to add?
4. Apply changes as batch `gh project item-edit` calls

## Step 4 — Release check

Check if a release is warranted:
1. `git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~50)..HEAD` — changes since last tag
2. Count: features, fixes, content additions
3. If 3+ meaningful changes since last release, suggest: "Enough changes for a release. Run `/release`?"
4. If not, note it: "Only N changes since last release — hold off."

Do not run `/release` automatically — just recommend.

## Step 5 — Plan the week

Based on the current backlog state, suggest a week plan:
1. **Must do** — any p0/p1 items (list them)
2. **Should do** — top 3 p2 items by effort (quick wins first)
3. **Could do** — 1-2 p3 items if time allows
4. **Blocked** — items that need something unblocked first

Present as a simple plan:
```
## This Week's Plan

### Must
- BL-005: Fix auth token refresh (p1/s)

### Should
- BL-031: Add cloze hint translations (p2/xs)
- BL-014: Lazy-load seed JSON (p2/m)
- BL-028: Progress page refresh (p2/s)

### Could
- BL-033: Dark mode polish (p3/xs)

### Blocked
- BL-019: Listening exercises — needs audio scraper update
```

---

## Rules

- This is a review session — never auto-commit, auto-merge, or auto-release
- Always confirm before making batch backlog changes
- Keep summaries concise — tables and bullet points, not paragraphs
- If the user runs `/weekly review`, stop after Step 3
- If the user runs `/weekly plan`, start from Step 4
- Use today's date for all timestamps
