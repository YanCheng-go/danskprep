# Skill: FSRS Spaced Repetition Integration

## Library

Use `ts-fsrs` (npm package) for all spaced repetition scheduling. FSRS runs client-side for zero latency.

```bash
npm install ts-fsrs
```

## Core Concepts

- **Card**: A single reviewable item (word, exercise, grammar rule)
- **State**: New (0), Learning (1), Review (2), Relearning (3)
- **Rating**: Again (1), Hard (2), Good (3), Easy (4)
- **Stability**: How slowly the memory fades. Higher = longer intervals.
- **Difficulty**: How hard the card is for this user. 0–10 scale.
- **Retrievability**: Probability of recalling right now. Drops over time.
- **Due**: When the card should next be reviewed.

## FSRS Wrapper

```typescript
// src/lib/fsrs.ts
import {
  fsrs,
  createEmptyCard,
  Rating,
  State,
  type Card,
  type RecordLog,
  type FSRSParameters,
} from 'ts-fsrs';

// Initialize scheduler with defaults (90% desired retention)
const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 365,
});

export { Rating, State };

/**
 * Create a brand-new FSRS card for a new study item
 */
export function createNewCard(): Card {
  return createEmptyCard(new Date());
}

/**
 * Convert database card state to ts-fsrs Card object
 */
export function dbToFsrsCard(dbCard: {
  state: number;
  difficulty: number;
  stability: number;
  due: string;
  last_review: string | null;
  reps: number;
  lapses: number;
}): Card {
  return {
    state: dbCard.state as State,
    difficulty: dbCard.difficulty,
    stability: dbCard.stability,
    due: new Date(dbCard.due),
    last_review: dbCard.last_review ? new Date(dbCard.last_review) : undefined,
    reps: dbCard.reps,
    lapses: dbCard.lapses,
    elapsed_days: 0,
    scheduled_days: 0,
  } as Card;
}

/**
 * Convert ts-fsrs Card back to database fields
 */
export function fsrsCardToDb(card: Card) {
  return {
    state: card.state,
    difficulty: card.difficulty,
    stability: card.stability,
    due: card.due.toISOString(),
    last_review: card.last_review?.toISOString() ?? null,
    reps: card.reps,
    lapses: card.lapses,
  };
}

/**
 * Schedule a review and return the updated card + log
 */
export function scheduleReview(card: Card, rating: Rating): { card: Card; log: RecordLog } {
  const now = new Date();
  const result = scheduler.repeat(card, now);
  const scheduled = result[rating];
  return {
    card: scheduled.card,
    log: scheduled.log,
  };
}

/**
 * Get all four scheduling options for display
 * (shows user what interval each rating would produce)
 */
export function getSchedulingOptions(card: Card) {
  const now = new Date();
  const result = scheduler.repeat(card, now);

  return {
    again: formatInterval(result[Rating.Again].card.due, now),
    hard: formatInterval(result[Rating.Hard].card.due, now),
    good: formatInterval(result[Rating.Good].card.due, now),
    easy: formatInterval(result[Rating.Easy].card.due, now),
  };
}

function formatInterval(due: Date, now: Date): string {
  const diffMs = due.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMin < 60) return `${diffMin}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 30) return `${diffDays}d`;
  return `${Math.round(diffDays / 30)}mo`;
}
```

## Review Flow (Hook)

```typescript
// src/hooks/useStudy.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import {
  Rating,
  createNewCard,
  dbToFsrsCard,
  fsrsCardToDb,
  scheduleReview,
  getSchedulingOptions,
} from '@/lib/fsrs';

export function useStudy() {
  const { user } = useAuth();
  const [dueCards, setDueCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load cards due for review
  useEffect(() => {
    if (!user) return;
    loadDueCards();
  }, [user]);

  const loadDueCards = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('user_cards')
      .select('*, word:words(*), exercise:exercises(*)')
      .eq('user_id', user!.id)
      .lte('due', new Date().toISOString())
      .order('due', { ascending: true })
      .limit(50);

    setDueCards(data ?? []);
    setCurrentIndex(0);
    setIsLoading(false);
  };

  const currentCard = dueCards[currentIndex] ?? null;

  // Get interval preview for current card
  const intervals = currentCard
    ? getSchedulingOptions(dbToFsrsCard(currentCard))
    : null;

  // Process a review rating
  const reviewCard = useCallback(async (
    rating: Rating,
    response?: string,
    wasCorrect?: boolean,
    timeTakenMs?: number,
  ) => {
    if (!currentCard || !user) return;

    // 1. Run FSRS scheduling
    const fsrsCard = dbToFsrsCard(currentCard);
    const { card: updatedCard } = scheduleReview(fsrsCard, rating);
    const dbFields = fsrsCardToDb(updatedCard);

    // 2. Update card state in database
    await supabase
      .from('user_cards')
      .update({
        ...dbFields,
        correct_count: currentCard.correct_count + (wasCorrect ? 1 : 0),
        incorrect_count: currentCard.incorrect_count + (wasCorrect ? 0 : 1),
        streak: wasCorrect ? currentCard.streak + 1 : 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentCard.id);

    // 3. Log the review
    await supabase.from('review_logs').insert({
      user_card_id: currentCard.id,
      user_id: user.id,
      rating,
      response,
      was_correct: wasCorrect ?? rating >= Rating.Good,
      time_taken_ms: timeTakenMs,
    });

    // 4. Advance to next card
    // If rated "Again", re-add to end of queue
    if (rating === Rating.Again) {
      setDueCards(prev => [...prev.slice(0, currentIndex), ...prev.slice(currentIndex + 1), currentCard]);
    } else {
      setDueCards(prev => prev.filter((_, i) => i !== currentIndex));
    }
  }, [currentCard, currentIndex, user]);

  return {
    currentCard,
    intervals,
    reviewCard,
    isLoading,
    cardsRemaining: dueCards.length - currentIndex,
    totalDue: dueCards.length,
  };
}
```

## Rating Buttons Component

Always show the next interval for each rating option so the user understands the consequence.

```tsx
// src/components/study/CardRating.tsx
import { Rating } from '@/lib/fsrs';

interface CardRatingProps {
  intervals: { again: string; hard: string; good: string; easy: string };
  onRate: (rating: Rating) => void;
}

export function CardRating({ intervals, onRate }: CardRatingProps) {
  const buttons = [
    { rating: Rating.Again, label: 'Again', interval: intervals.again, color: 'bg-red-500 hover:bg-red-600' },
    { rating: Rating.Hard, label: 'Hard', interval: intervals.hard, color: 'bg-orange-500 hover:bg-orange-600' },
    { rating: Rating.Good, label: 'Good', interval: intervals.good, color: 'bg-blue-500 hover:bg-blue-600' },
    { rating: Rating.Easy, label: 'Easy', interval: intervals.easy, color: 'bg-green-500 hover:bg-green-600' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {buttons.map(({ rating, label, interval, color }) => (
        <button
          key={rating}
          onClick={() => onRate(rating)}
          className={`flex flex-col items-center py-3 px-2 rounded-lg text-white transition-colors ${color}`}
        >
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs opacity-80">{interval}</span>
        </button>
      ))}
    </div>
  );
}
```

> Enforced rules for FSRS are in `.claude/rules/fsrs-rules.md` (auto-attached when editing `src/lib/fsrs.ts` or `src/hooks/useStudy.ts`).
