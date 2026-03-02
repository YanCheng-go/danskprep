---
name: architecture-review
description: Review architecture changes, evaluate design decisions, write ADRs
user-invocable: true
---

# Architecture Review

Review proposed or implemented architecture changes. Acts as the Solution Architect role: evaluates system design decisions, API contracts, module boundaries, and records decisions as ADRs (Architecture Decision Records).

## Instructions

Use this skill when:
- Designing a new major feature before implementation
- Reviewing a PR that crosses module boundaries (new hook + new page + new DB table)
- Deciding between two implementation approaches
- Someone asks "how should we structure X?"

---

### Step 1 — Understand the Current Architecture

Read the relevant files to understand existing patterns:

```bash
# Module structure
ls src/{components,pages,hooks,lib,types}/

# Existing hooks (data flow patterns)
head -30 src/hooks/useStudy.ts src/hooks/useQuiz.ts src/hooks/useWords.ts

# Routing
grep "Route\|path=" src/App.tsx

# DB schema
cat supabase/migrations/001_initial_schema.sql
```

---

### Step 2 — Evaluate the Proposed Change

Check against these architectural principles (from CLAUDE.md):

| Principle | Check |
|-----------|-------|
| **Exam-focused** | Does this map to a specific exam topic or user need? |
| **No data fetching in components** | Data flows: Supabase/JSON → hook → page → component |
| **Client-side FSRS** | Scheduling logic stays in `useStudy`, not components or backend |
| **Single Supabase client** | Only `src/lib/supabase.ts` creates the client |
| **RLS on all tables** | Every new table must have RLS policies |
| **Offline-capable SRS** | FSRS runs without network; sync on reconnect |
| **Mobile-first** | Every new UI works at 375px |

---

### Step 3 — Data Flow Diagram

For any new feature, draw the data flow:

```
[Source]          →  [Hook]          →  [Page]         →  [Component]
Supabase table    →  useWords()      →  VocabPage      →  WordList
Local JSON        →  useGrammar()    →  GrammarPage    →  TopicList
FSRS + Supabase   →  useStudy()      →  StudyPage      →  Flashcard
```

Identify where new data will come from and which hook owns it.

---

### Step 4 — API Contract (if adding Supabase tables or edge functions)

Define the contract before implementation:

```typescript
// Table: new_table
interface NewTableRow {
  id: string           // uuid, generated
  user_id: string      // references auth.users
  created_at: string   // timestamptz, default now()
  // ... domain fields
}

// RLS policies needed:
// SELECT: user_id = auth.uid()
// INSERT: user_id = auth.uid()
// UPDATE: user_id = auth.uid()
// DELETE: user_id = auth.uid()
```

---

### Step 5 — ADR (Architecture Decision Record)

For significant decisions, write an ADR. Save to `docs/adr/NNN-title.md`:

```markdown
# ADR-NNN: <Title>

## Status
Proposed | Accepted | Deprecated | Superseded by ADR-XXX

## Context
Why is this decision needed? What forces are at play?

## Decision
What was decided?

## Consequences
**Positive:** ...
**Negative / trade-offs:** ...
**Risks:** ...

## Alternatives considered
1. **Alternative A** — rejected because...
2. **Alternative B** — rejected because...
```

---

### Output Format

```
## Architecture Review — <Feature Name>

### Current state
Brief description of relevant existing architecture.

### Proposed change
What's being added/changed and how it fits.

### Data flow
[Diagram as above]

### Concerns
- [CONCERN] Description → suggested resolution

### Decision
✓ Approved as-is / ⚠ Approved with changes / ✗ Rethink needed

### Recommended next steps
1. ...
2. ...

### ADR
(include ADR text if decision is significant)
```
