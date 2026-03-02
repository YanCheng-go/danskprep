---
globs:
  - "src/lib/fsrs.ts"
  - "src/hooks/useStudy.ts"
---

# FSRS Spaced Repetition Rules

## Library
- Use `ts-fsrs` — never implement scheduling math manually
- Import: `import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs'`

## Card Lifecycle
- New card: `createEmptyCard()` — state 0 (New)
- After each review: call `fsrs().repeat(card, reviewDate)` to get next states for all 4 ratings
- Apply the rating the user selected: `schedulingInfo[rating].card`
- Persist updated card to Supabase `user_cards` immediately after review

## Ratings (do not change the mapping)
```typescript
Rating.Again = 1  // User couldn't recall — resets progress
Rating.Hard  = 2  // Recalled with difficulty
Rating.Good  = 3  // Recalled correctly with normal effort
Rating.Easy  = 4  // Recalled immediately, no effort
```

## Configuration
- Default desired retention: **0.9** (90%) — do not change without user consent
- FSRS parameters: use `generatorParameters({ request_retention: 0.9 })`
- All scheduling runs **client-side** — no backend edge functions for FSRS

## Due Queue
- "Due today" = `user_cards` where `due <= now()` and `state != 0` (existing cards)
- "New cards" = limit from `state = 0` cards, cap at daily new card limit (default: 20)
- Sort: overdue cards first (oldest `due` date), then new cards

## Data Persistence
- After each review, update `user_cards` row with new FSRS fields AND insert a `review_logs` row
- `review_logs` captures: `rating`, `response` (what user typed), `was_correct`, `time_taken_ms`
- If Supabase sync fails, queue the update locally and retry — do not lose FSRS state

## Avoiding Common Mistakes
- Never schedule reviews with `new Date()` directly; use the `due` date from `fsrs().repeat()`
- Never store intermediate scheduling objects in the database — only store the final `card` state
- `retrievability` is computed, not stored — recalculate if needed from stability + elapsed days

## ts-fsrs TypeScript Pitfalls (learned in build)

### Rating.Manual = 0 causes type errors
`ts-fsrs` defines `Rating.Manual = 0` in addition to Again/Hard/Good/Easy (1–4).
**Problem**: Using `Rating` as a key type or indexing `RecordLog` with `Rating` causes TS errors because TypeScript sees all enum values including `Manual`.

**Solutions:**
```typescript
// ❌ WRONG — SchedulingOptions keyed by Rating causes TS error
type SchedulingOptions = Record<Rating, SchedulingOption>

// ✓ CORRECT — use explicit numeric union
type SchedulingOptions = Record<1 | 2 | 3 | 4, SchedulingOption>

// ❌ WRONG — indexing RecordLog with Rating enum
const result = recordLog[Rating.Again]  // TS: Property '[Rating.Manual]' does not exist

// ✓ CORRECT — cast recordLog to any (with comment)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const recordLog: any = f.repeat(card, now)
const result = recordLog[Rating.Again]

// ✓ Also CORRECT — use explicit numbers as keys in return object
return { 1: buildOption(...), 2: buildOption(...), 3: buildOption(...), 4: buildOption(...) }
```

### Don't import RecordLog if you cast to any
If you cast `f.repeat()` result to `any`, remove the `RecordLog` import — TypeScript will flag it as unused.
