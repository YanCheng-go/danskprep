# Skill: Quiz Engine & Exercise Logic

## Exercise Types

The app supports 7 exercise types. Each has a specific data shape, renderer, and answer-checking logic.

```typescript
// src/types/quiz.ts
export type ExerciseType =
  | 'type_answer'
  | 'cloze'
  | 'multiple_choice'
  | 'word_order'
  | 'error_correction'
  | 'matching'
  | 'conjugation';

export interface Exercise {
  id: string;
  exercise_type: ExerciseType;
  question: string;            // prompt shown to user
  correct_answer: string;      // primary correct answer
  alternatives?: string[];     // wrong answers (for multiple choice)
  acceptable_answers?: string[]; // other accepted answers (e.g., "æble" and "et æble")
  hint?: string;
  explanation?: string;        // shown after answering
  grammar_topic_id?: string;
  word_id?: string;
  module_level: number;
  difficulty: number;
}

export interface QuizSession {
  exercises: Exercise[];
  currentIndex: number;
  answers: QuizAnswer[];
  startedAt: Date;
}

export interface QuizAnswer {
  exerciseId: string;
  response: string;
  isCorrect: boolean;
  timeTakenMs: number;
}
```

## Answer Checking

```typescript
// src/lib/answer-check.ts

/**
 * Normalize Danish text for comparison.
 * - Lowercase
 * - Trim whitespace
 * - Optionally convert ae/oe/aa → æ/ø/å
 * - Collapse multiple spaces
 * - Remove trailing punctuation for single-word answers
 */
export function normalizeDanish(text: string, options?: { convertDigraphs?: boolean }): string {
  let s = text.trim().toLowerCase().replace(/\s+/g, ' ');

  if (options?.convertDigraphs !== false) {
    // Only convert digraphs that aren't part of longer words
    // e.g., "ae" → "æ" but careful with words like "aerobic"
    s = s.replace(/(?<![a-zæøå])ae(?![a-zæøå])/g, 'æ')
         .replace(/(?<![a-zæøå])oe(?![a-zæøå])/g, 'ø')
         .replace(/(?<![a-zæøå])aa(?![a-zæøå])/g, 'å');
  }

  return s;
}

/**
 * Check if user's answer matches the correct answer.
 * Handles multiple acceptable answers.
 */
export function checkAnswer(
  userAnswer: string,
  correctAnswer: string,
  acceptableAnswers?: string[]
): { isCorrect: boolean; closestMatch?: string } {
  const normalized = normalizeDanish(userAnswer);
  const allAcceptable = [correctAnswer, ...(acceptableAnswers ?? [])];

  for (const answer of allAcceptable) {
    if (normalized === normalizeDanish(answer)) {
      return { isCorrect: true };
    }
  }

  // Check for "almost correct" (within edit distance 1)
  const closest = allAcceptable.find(
    ans => levenshtein(normalized, normalizeDanish(ans)) <= 1
  );

  return { isCorrect: false, closestMatch: closest };
}

/**
 * Simple Levenshtein distance for typo detection
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[a.length][b.length];
}
```

## Quiz Session Management

```typescript
// src/hooks/useQuiz.ts
import { useState, useCallback, useRef } from 'react';
import { checkAnswer } from '@/lib/answer-check';
import type { Exercise, QuizSession, QuizAnswer } from '@/types/quiz';

interface UseQuizOptions {
  exercises: Exercise[];
  onComplete: (answers: QuizAnswer[]) => void;
}

export function useQuiz({ exercises, onComplete }: UseQuizOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; closestMatch?: string } | null>(null);
  const startTimeRef = useRef(Date.now());

  const currentExercise = exercises[currentIndex] ?? null;
  const isComplete = currentIndex >= exercises.length;
  const progress = exercises.length > 0 ? currentIndex / exercises.length : 0;

  const submitAnswer = useCallback((response: string) => {
    if (!currentExercise) return;

    const timeTaken = Date.now() - startTimeRef.current;
    const result = checkAnswer(response, currentExercise.correct_answer, currentExercise.acceptable_answers);

    const answer: QuizAnswer = {
      exerciseId: currentExercise.id,
      response,
      isCorrect: result.isCorrect,
      timeTakenMs: timeTaken,
    };

    setLastResult(result);
    setAnswers(prev => [...prev, answer]);
    setShowFeedback(true);
  }, [currentExercise]);

  const nextQuestion = useCallback(() => {
    setShowFeedback(false);
    setLastResult(null);
    startTimeRef.current = Date.now();

    const nextIdx = currentIndex + 1;
    if (nextIdx >= exercises.length) {
      onComplete(answers);
    }
    setCurrentIndex(nextIdx);
  }, [currentIndex, exercises.length, answers, onComplete]);

  // Computed stats
  const stats = {
    total: answers.length,
    correct: answers.filter(a => a.isCorrect).length,
    accuracy: answers.length > 0
      ? answers.filter(a => a.isCorrect).length / answers.length
      : 0,
    avgTime: answers.length > 0
      ? answers.reduce((sum, a) => sum + a.timeTakenMs, 0) / answers.length
      : 0,
  };

  return {
    currentExercise,
    currentIndex,
    isComplete,
    progress,
    showFeedback,
    lastResult,
    stats,
    submitAnswer,
    nextQuestion,
  };
}
```

## Exercise Generation from Database

```typescript
// src/lib/quiz-engine.ts
import type { Exercise, ExerciseType } from '@/types/quiz';

interface Word {
  id: string;
  danish: string;
  english: string;
  part_of_speech: string;
  gender?: string;
  inflections?: Record<string, string>;
  example_da?: string;
  example_en?: string;
}

/**
 * Generate exercises dynamically from word data.
 * Used to create quizzes on-the-fly from the vocabulary table.
 */
export function generateWordExercises(
  word: Word,
  allWords: Word[],
  types: ExerciseType[] = ['type_answer', 'multiple_choice']
): Exercise[] {
  const exercises: Exercise[] = [];

  // Type answer: English → Danish
  if (types.includes('type_answer')) {
    exercises.push({
      id: `${word.id}-type-en-da`,
      exercise_type: 'type_answer',
      question: `Translate to Danish: "${word.english}"`,
      correct_answer: word.danish,
      explanation: word.example_da ? `Example: ${word.example_da}` : undefined,
      module_level: 2,
      difficulty: 1,
    });
  }

  // Type answer: Danish → English
  if (types.includes('type_answer')) {
    exercises.push({
      id: `${word.id}-type-da-en`,
      exercise_type: 'type_answer',
      question: `Translate to English: "${word.danish}"`,
      correct_answer: word.english,
      module_level: 2,
      difficulty: 1,
    });
  }

  // Multiple choice
  if (types.includes('multiple_choice')) {
    const distractors = getDistractors(word, allWords, 3);
    exercises.push({
      id: `${word.id}-mc`,
      exercise_type: 'multiple_choice',
      question: `What does "${word.danish}" mean?`,
      correct_answer: word.english,
      alternatives: distractors.map(d => d.english),
      module_level: 2,
      difficulty: 1,
    });
  }

  // Noun gender quiz
  if (word.part_of_speech === 'noun' && word.gender) {
    exercises.push({
      id: `${word.id}-gender`,
      exercise_type: 'multiple_choice',
      question: `Is "${word.danish}" an en-word or et-word?`,
      correct_answer: word.gender === 'en' ? 'en (common)' : 'et (neuter)',
      alternatives: [word.gender === 'en' ? 'et (neuter)' : 'en (common)'],
      explanation: `It is: ${word.gender} ${word.danish}`,
      module_level: 2,
      difficulty: 1,
    });
  }

  // Verb conjugation
  if (word.part_of_speech === 'verb' && word.inflections) {
    const inf = word.inflections;
    if (inf.present) {
      exercises.push({
        id: `${word.id}-conj-present`,
        exercise_type: 'type_answer',
        question: `Present tense of "at ${word.danish}":`,
        correct_answer: inf.present,
        explanation: `at ${word.danish} → ${inf.present} (nutid)`,
        module_level: 2,
        difficulty: 2,
      });
    }
    if (inf.past) {
      exercises.push({
        id: `${word.id}-conj-past`,
        exercise_type: 'type_answer',
        question: `Past tense of "at ${word.danish}":`,
        correct_answer: inf.past,
        explanation: `at ${word.danish} → ${inf.past} (datid)`,
        module_level: 2,
        difficulty: 2,
      });
    }
  }

  // Adjective comparative/superlative
  if (word.part_of_speech === 'adjective' && word.inflections) {
    const inf = word.inflections;
    if (inf.comparative) {
      exercises.push({
        id: `${word.id}-comp`,
        exercise_type: 'type_answer',
        question: `Comparative of "${word.danish}":`,
        correct_answer: inf.comparative,
        acceptable_answers: inf.comparative_alt ? [inf.comparative_alt] : undefined,
        explanation: `${word.danish} → ${inf.comparative} → ${inf.superlative ?? '...'}`,
        module_level: 2,
        difficulty: 2,
      });
    }
  }

  return exercises;
}

/**
 * Pick N random distractor words for multiple choice.
 * Tries to pick same POS for harder distractors.
 */
function getDistractors(target: Word, allWords: Word[], count: number): Word[] {
  const samePOS = allWords.filter(w => w.id !== target.id && w.part_of_speech === target.part_of_speech);
  const pool = samePOS.length >= count ? samePOS : allWords.filter(w => w.id !== target.id);

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Shuffle an array (Fisher-Yates)
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

## Quiz Results Component

```tsx
// src/components/quiz/QuizResults.tsx
interface QuizResultsProps {
  stats: { total: number; correct: number; accuracy: number; avgTime: number };
  onRetryWrong: () => void;
  onNewQuiz: () => void;
  onGoHome: () => void;
}

export function QuizResults({ stats, onRetryWrong, onNewQuiz, onGoHome }: QuizResultsProps) {
  const pct = Math.round(stats.accuracy * 100);

  return (
    <div className="text-center space-y-6 py-8">
      <div className="text-6xl font-bold">
        {pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚'}
      </div>
      <h2 className="text-2xl font-semibold">{pct}% Correct</h2>
      <p className="text-muted-foreground">
        {stats.correct} of {stats.total} questions •
        avg {Math.round(stats.avgTime / 1000)}s per question
      </p>

      <div className="flex gap-3 justify-center pt-4">
        {stats.correct < stats.total && (
          <button onClick={onRetryWrong} className="px-4 py-2 rounded bg-orange-500 text-white">
            Retry Wrong Answers
          </button>
        )}
        <button onClick={onNewQuiz} className="px-4 py-2 rounded bg-primary text-primary-foreground">
          New Quiz
        </button>
        <button onClick={onGoHome} className="px-4 py-2 rounded border">
          Done
        </button>
      </div>
    </div>
  );
}
```

## Key Rules

- Always use `checkAnswer()` from `answer-check.ts`. Never compare strings with `===` directly.
- Accept both æøå and ae/oe/aa input by default.
- Show "almost correct" feedback when edit distance is 1 (typo detection).
- Time every answer (start timer on question display, stop on submit).
- After feedback, require explicit "Next" action — don't auto-advance.
- Quiz sessions are independent of the SRS review queue. Quizzes are for practice; SRS reviews update card state.
- Multiple choice distractors should be same POS as the target for difficulty.
- Shuffle multiple choice options randomly every time.
