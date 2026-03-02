---
name: quiz-engine
description: Implement or extend quiz functionality and answer checking
user-invocable: true
---

# Quiz Engine

Implement or extend quiz functionality. Key files: `src/types/quiz.ts`, `src/lib/quiz-engine.ts`, `src/lib/answer-check.ts`, `src/hooks/useQuiz.ts`.

## Exercise types
| Type | `exercise_type` | Answer input | Notes |
|------|----------------|-------------|-------|
| Type answer | `type_answer` | Text field | Most common; EN→DA or DA→EN |
| Cloze | `cloze` | Text field | One blank per sentence; unambiguous answer |
| Multiple choice | `multiple_choice` | Button pick | 4 options; distractors same POS |
| Word order | `word_order` | Drag/tap chips | Exactly one correct arrangement |
| Error correction | `error_correction` | Text field | Exactly one grammatical error |
| Matching | `matching` | Pair selection | DA <-> EN pairs |
| Conjugation | `conjugation` | Multiple fields | All tense forms for one verb |

## Answer checking rules
- **Always use `checkAnswer()` from `src/lib/answer-check.ts`** — never compare strings with `===`
- Accepts both ae/oe/aa and æ/ø/å input by default
- Returns `{ isCorrect, isAlmostCorrect, closestMatch }` — show "almost" feedback when edit distance = 1
- Uses Damerau-Levenshtein (transpositions count as 1 edit, not 2)

## Quiz vs SRS distinction
- **Quiz**: practice mode, no FSRS state changes, exercises from `src/data/seed/`
- **SRS review**: updates `user_cards` in Supabase after every rating
- `useQuiz` hook manages quiz sessions; `useStudy` hook manages SRS reviews — never mix them

## Dynamic exercise generation from words
`generateWordExercises(word, allWords, types)` in `quiz-engine.ts` produces type_answer + multiple_choice + gender + conjugation exercises from a `Word` row. Distractors are picked from same POS first.

## Key UX rules
- Time every answer (`useRef(Date.now())` on question mount, delta on submit)
- After feedback, require explicit "Next" tap — never auto-advance
- Shuffle multiple choice options on every render (`shuffle()` from `quiz-engine.ts`)
- Show explanation after answering, whether correct or not
