# FSRS Integration

Implement or extend spaced repetition in DanskPrep. See `.claude/rules/fsrs-rules.md` for the authoritative rules (auto-attached when editing `src/lib/fsrs.ts` or `src/hooks/useStudy.ts`).

## Key files
- `src/lib/fsrs.ts` — scheduler init, `dbToFsrsCard`, `fsrsCardToDb`, `scheduleReview`, `getSchedulingOptions`
- `src/hooks/useStudy.ts` — due queue, `reviewCard()`, Supabase sync
- `src/components/study/CardRating.tsx` — 4-button rating UI with interval preview

## DB ↔ FSRS field mapping
```typescript
// Supabase user_cards → ts-fsrs Card
{ state, difficulty, stability, due, last_review, reps, lapses }
→ Card { state, difficulty, stability, due: new Date(due), last_review: new Date(last_review) | undefined, reps, lapses, elapsed_days: 0, scheduled_days: 0 }

// After review: Card → Supabase
card.due.toISOString(), card.last_review?.toISOString() ?? null
```

## Review flow (order matters)
1. Fetch due cards: `due <= now()` ordered by `due ASC`, limit 50
2. Display card, start timer
3. User rates (1–4) → `scheduleReview(dbToFsrsCard(row), rating)`
4. `UPDATE user_cards SET ...fsrsCardToDb(updatedCard)` + increment correct/incorrect/streak
5. `INSERT review_logs` with rating, response, was_correct, time_taken_ms
6. If `rating === Again`: re-append card to end of queue; otherwise remove it

## Rating UI rule
Always show the next interval next to each button so users understand the consequence:
```
Again (5m) | Hard (1d) | Good (4d) | Easy (14d)
```
Use `getSchedulingOptions(card)` which returns `{ again, hard, good, easy }` as human-readable strings.

## TypeScript pitfall
`Rating.Manual = 0` causes type errors. Use numeric literals `1|2|3|4` instead of `Rating` as key type. Cast `f.repeat()` result to `any` when indexing — see `fsrs-rules.md`.
