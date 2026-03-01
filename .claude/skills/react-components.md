# Skill: React Component Patterns

## Component Architecture

All components are functional React components with TypeScript. Follow these patterns strictly.

## Page Components

Page components live in `src/pages/`. They handle routing, data fetching, and compose UI components.

```tsx
// src/pages/StudyPage.tsx
import { useStudy } from '@/hooks/useStudy';
import { ReviewQueue } from '@/components/study/ReviewQueue';
import { PageContainer } from '@/components/layout/PageContainer';

export function StudyPage() {
  const { dueCards, reviewCard, isLoading } = useStudy();

  if (isLoading) return <PageContainer><LoadingSkeleton /></PageContainer>;
  if (dueCards.length === 0) return <PageContainer><EmptyState message="No cards due today!" /></PageContainer>;

  return (
    <PageContainer title="Daily Review">
      <ReviewQueue cards={dueCards} onReview={reviewCard} />
    </PageContainer>
  );
}
```

## UI Components

UI components are pure/presentational. They receive data via props and emit events via callbacks. No direct data fetching.

```tsx
// src/components/study/FlashCard.tsx
import { useState } from 'react';
import type { WordCard } from '@/types/study';

interface FlashCardProps {
  card: WordCard;
  onRate: (rating: 1 | 2 | 3 | 4) => void;
}

export function FlashCard({ card, onRate }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="min-h-[200px] p-6 rounded-xl border bg-card cursor-pointer 
                   flex items-center justify-center text-center transition-all"
      >
        {isFlipped ? (
          <div>
            <p className="text-2xl font-semibold">{card.danish}</p>
            {card.example_da && (
              <p className="mt-3 text-sm text-muted-foreground italic">{card.example_da}</p>
            )}
          </div>
        ) : (
          <p className="text-2xl">{card.english}</p>
        )}
      </div>

      {isFlipped && (
        <div className="flex gap-2 mt-4 justify-center">
          <button onClick={() => onRate(1)} className="px-4 py-2 rounded bg-red-500 text-white">Again</button>
          <button onClick={() => onRate(2)} className="px-4 py-2 rounded bg-orange-500 text-white">Hard</button>
          <button onClick={() => onRate(3)} className="px-4 py-2 rounded bg-blue-500 text-white">Good</button>
          <button onClick={() => onRate(4)} className="px-4 py-2 rounded bg-green-500 text-white">Easy</button>
        </div>
      )}
    </div>
  );
}
```

## Quiz Components

Quiz components follow a standard pattern: question display → user input → feedback → next.

```tsx
// src/components/quiz/TypeAnswer.tsx
import { useState, useRef, useEffect } from 'react';
import { DanishInput } from '@/components/ui/DanishInput';
import type { Exercise } from '@/types/quiz';

interface TypeAnswerProps {
  exercise: Exercise;
  onAnswer: (response: string, isCorrect: boolean) => void;
}

export function TypeAnswer({ exercise, onAnswer }: TypeAnswerProps) {
  const [response, setResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setResponse('');
    setSubmitted(false);
  }, [exercise.id]);

  const handleSubmit = () => {
    const correct = checkAnswer(response, exercise.correct_answer);
    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(response, correct);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg">{exercise.question}</p>

      <DanishInput
        ref={inputRef}
        value={response}
        onChange={setResponse}
        onSubmit={handleSubmit}
        disabled={submitted}
        placeholder="Type your answer..."
      />

      {!submitted && (
        <button onClick={handleSubmit} className="w-full py-2 rounded bg-primary text-primary-foreground">
          Check
        </button>
      )}

      {submitted && (
        <div className={`p-4 rounded ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
          <p className="font-semibold">{isCorrect ? '✓ Correct!' : '✗ Incorrect'}</p>
          {!isCorrect && <p className="mt-1">Correct answer: <strong>{exercise.correct_answer}</strong></p>}
          {exercise.explanation && <p className="mt-2 text-sm text-muted-foreground">{exercise.explanation}</p>}
        </div>
      )}
    </div>
  );
}
```

## DanishInput Component

Always use this for any text input where the user types Danish. It provides virtual keys for æ, ø, å.

```tsx
// src/components/ui/DanishInput.tsx
import { forwardRef } from 'react';

interface DanishInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const DanishInput = forwardRef<HTMLInputElement, DanishInputProps>(
  ({ value, onChange, onSubmit, disabled, placeholder }, ref) => {
    const insertChar = (char: string) => {
      onChange(value + char);
      // Re-focus the input after clicking a virtual key
      (ref as React.RefObject<HTMLInputElement>)?.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
    };

    return (
      <div className="space-y-2">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <div className="flex gap-2">
          {['æ', 'ø', 'å', 'Æ', 'Ø', 'Å'].map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => insertChar(char)}
              disabled={disabled}
              className="px-3 py-1 text-sm border rounded hover:bg-muted transition-colors"
            >
              {char}
            </button>
          ))}
        </div>
      </div>
    );
  }
);
```

## Custom Hooks Pattern

Hooks encapsulate data fetching, state management, and business logic.

```tsx
// src/hooks/useStudy.ts
import { useState, useEffect, useCallback } from 'react';
import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs';
import { supabase } from '@/lib/supabase';
import type { UserCard, ReviewableCard } from '@/types/study';

export function useStudy() {
  const [dueCards, setDueCards] = useState<ReviewableCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scheduler = fsrs();

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_cards')
      .select('*, words(*), exercises(*)')
      .lte('due', new Date().toISOString())
      .order('due', { ascending: true })
      .limit(50);

    if (data) setDueCards(data as ReviewableCard[]);
    setIsLoading(false);
  };

  const reviewCard = useCallback(async (cardId: string, rating: Rating) => {
    // 1. Get current card state
    // 2. Run FSRS scheduling
    // 3. Update card in Supabase
    // 4. Log the review
    // 5. Remove from dueCards or re-sort
  }, [scheduler]);

  return { dueCards, reviewCard, isLoading, cardsRemaining: dueCards.length };
}
```

## Answer Checking

Always use `checkAnswer()` from `src/lib/answer-check.ts`. Never compare strings directly. See `quiz-engine.md` for the full implementation including Levenshtein-based typo detection and æøå normalisation.

## Routing

Use React Router v6 with lazy loading for pages.

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AuthGuard } from '@/components/layout/AuthGuard';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index element={<HomePage />} />
          <Route path="study" element={<StudyPage />} />
          <Route path="grammar" element={<GrammarPage />} />
          <Route path="grammar/:slug" element={<GrammarTopicPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="vocabulary" element={<VocabularyPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

> Enforced React/TypeScript/Tailwind rules are in `.claude/rules/react-conventions.md` (auto-attached when editing components, pages, and hooks).
