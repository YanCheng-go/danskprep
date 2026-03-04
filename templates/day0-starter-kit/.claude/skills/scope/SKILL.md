---
name: scope
description: "Break a backlog item into sub-tasks with effort estimates, risks, and affected files"
user-invocable: true
argument-hint: "<backlog-item-id or description>"
---

# /scope — Scope & Estimate

## Steps

### Step 1: Load Item
If given a backlog ID, fetch the full description. Otherwise treat the argument as an ad-hoc description.

### Step 2: Explore Codebase
Use Glob, Grep, Read to understand:
- What files will be touched
- What existing patterns to follow
- What utilities/hooks/components can be reused

### Step 3: Break Down
Decompose into 3-8 sub-tasks:

| # | Task | Files | Effort | Dependencies | Notes |
|---|------|-------|--------|-------------|-------|
| 1 | ... | ... | xs/s/m/l | — | ... |
| 2 | ... | ... | s | #1 | ... |

### Step 4: Identify Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| ... | high/med/low | high/med/low | ... |

Risk categories to check:
- Breaking existing functionality
- Performance impact
- Security implications
- Mobile/responsive compatibility
- Migration complexity

### Step 5: Estimate Total
Sum sub-task efforts + 20% buffer for unknowns.

| Effort | Meaning |
|--------|---------|
| xs | < 30 min, trivial |
| s | 30 min – 2 hours |
| m | 2 – 4 hours |
| l | 4 – 8 hours |
| xl | Multi-session |

### Step 6: Present & Offer Follow-up
Present the scope document and offer:
1. Update backlog with this scope
2. Create sub-task items in backlog
3. Start a spike for high-risk areas
4. Start building immediately
