---
name: scope
description: Break a backlog item into sub-tasks with effort estimates, risks, and affected files
user-invocable: true
---

# /scope — Scope and Estimate a Backlog Item

## When to use

When a backlog item is too vague to start working on. This skill takes a `BL-NNN` item (or a description) and produces a detailed breakdown: sub-tasks, effort estimates, affected files, risks, and dependencies.

## Steps

### Step 1 — Load the item

If given a backlog ID:
1. Read `docs/backlog.md` and find the item detail section
2. If the item doesn't exist, tell the user and offer to create it first via `/backlog add`

If given a raw description (no BL-NNN):
1. Treat it as an ad-hoc scoping request
2. Offer to create a backlog item after scoping is complete

### Step 2 — Explore the codebase

Investigate what exists today:
1. Use Glob and Grep to find files related to the item's area
2. Read key files to understand current patterns and architecture
3. Identify what already exists that can be reused vs. what needs to be built new
4. Check for related backlog items that might overlap or be dependencies

### Step 3 — Break into sub-tasks

Decompose the item into ordered sub-tasks. For each sub-task:

| Field | Description |
|---|---|
| **#** | Sequential number (1, 2, 3...) |
| **Task** | Imperative description of the work |
| **Files** | Specific files to create or modify |
| **Effort** | `xs` / `s` / `m` / `l` estimate |
| **Dependencies** | Which sub-tasks must complete first |
| **Notes** | Implementation hints, patterns to follow, gotchas |

### Step 4 — Identify risks and unknowns

For each risk:
- **What could go wrong** — specific technical risk
- **Impact** — what happens if it materializes (low/medium/high)
- **Mitigation** — how to reduce or handle the risk

Common risk categories to check:
- Breaking existing functionality
- Performance impact (bundle size, render time)
- Missing data or seed content needed
- External dependencies (API keys, credentials)
- Mobile/dark mode compatibility
- TypeScript strict mode compliance

### Step 5 — Estimate total effort

Roll up sub-task estimates into an overall effort:
- Sum of sub-tasks gives the raw effort
- Add 20% buffer for integration, testing, and unexpected issues
- Compare against the item's current effort field — if significantly different, recommend updating it

### Step 6 — Present the scope document

Output in this format:

```
## Scope: BL-NNN — <title>

### Overview
One paragraph: what needs to happen and the recommended approach.

### Sub-tasks

| # | Task | Files | Effort | Deps |
|---|------|-------|--------|------|
| 1 | Create new hook for X | src/hooks/useX.ts | s | — |
| 2 | Build component Y | src/components/quiz/Y.tsx | m | 1 |
| 3 | Add seed data | src/data/seed/x.json | s | — |
| 4 | Write tests | src/test/Y.test.ts | s | 2 |
| 5 | Update page to use Y | src/pages/QuizPage.tsx | xs | 2 |

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| New component may not match mobile layout | Medium | Build mobile-first, test at 375px |
| Seed data format may need schema changes | Low | Check against existing exercises schema first |

### Total Effort
- Sub-tasks: 3 × s + 1 × m + 1 × xs = ~M overall
- With buffer: M
- Current backlog estimate: s → **recommend updating to M**

### Dependencies
- Requires: BL-003 (if applicable)
- Blocks: BL-007 (if applicable)
- External: ANTHROPIC_API_KEY needed (if applicable)

### Suggested approach
Brief recommendation on implementation order and any architectural decisions.
```

### Step 7 — Offer follow-up actions

Ask the user:
1. **Update the backlog item?** — update effort, add dependencies, refine description
2. **Create sub-task items?** — optionally break into separate BL items with dependency links
3. **Start a spike?** — if unknowns are too high, suggest a research spike first
4. **Start building?** — if scope is clear, offer to begin implementation

## Rules

- Always explore the codebase before estimating — never guess effort without reading code
- Reference specific file paths and line numbers when identifying affected code
- Follow existing patterns — if a similar feature exists, show how this one should mirror it
- Be honest about unknowns — flag them as risks rather than guessing
- Keep sub-tasks small enough that each could be a single commit
- Maximum 10 sub-tasks — if more are needed, the item should be split into multiple backlog items
- Do not modify any files during scoping — this is a read-only analysis
