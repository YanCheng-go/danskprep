# QA Review

Audit test coverage and write missing tests. Run before releases or when a bug is found.

## Test pyramid
```
E2E (future Playwright) — critical journeys: complete study session, full quiz
Component (RTL)         — interactive UI: answer submission, feedback display
Unit (Vitest)           — pure logic: answer-check, fsrs, quiz-engine, danish-input
```

## Coverage audit
```bash
npm test -- --run --coverage 2>&1 | tail -40
find src -name "*.test.*" | sort
```

| Area | File | Status |
|------|------|--------|
| Answer checking | `src/lib/answer-check.ts` | ✓ 20 tests |
| FSRS scheduling | `src/lib/fsrs.ts` | ✗ missing |
| Quiz engine | `src/lib/quiz-engine.ts` | ✗ missing |
| Danish input | `src/lib/danish-input.ts` | ✗ missing |
| useQuiz hook | `src/hooks/useQuiz.ts` | ✗ missing |

## Test quality rules
- Describe **behaviour**, not implementation: `it('accepts ae as æ equivalent')` not `it('calls normalise()')`
- Cover: empty input, æøå chars, case + whitespace, error paths (Supabase failure, empty array)
- BDD naming: `describe('when user types wrong answer') { it('shows correct answer in feedback') }`
- Co-locate test files: `ComponentName.test.tsx` next to `ComponentName.tsx`
- Regression rule: write a failing test **before** fixing any bug

## Pre-release quality gate
- [ ] `npm test -- --run` — all tests pass
- [ ] Answer checking covered for any new exercise types
- [ ] All 6 grammar topic slugs resolve to content
- [ ] FSRS tested: new card (state=0) → state≥1 after Good rating
- [ ] No console errors on `npm run dev`
- [ ] Layout checked at 375px mobile viewport

## Output format
```
## QA Review — <feature>
| Area | Status | Gap |
|------|--------|-----|
| answer-check | ✓ 20 tests | — |
| FSRS | ✗ 0 tests | HIGH: schedule new card, Again resets |

Missing tests (priority):
1. [HIGH] FSRS new card scheduling
2. [MEDIUM] useQuiz answer submission flow

Verdict: ✓ Ready / ⚠ Merge with todo / ✗ Needs tests first
```
