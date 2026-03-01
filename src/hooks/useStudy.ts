import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { scheduleReview, getSchedulingOptions, createNewCard } from '@/lib/fsrs'
import type { UserCard } from '@/types/database'
import type { ReviewableCard, SchedulingOptions } from '@/types/study'
import type { Exercise } from '@/types/quiz'
import exercisesData from '@/data/seed/exercises-module2.json'
import { DAILY_NEW_CARDS_LIMIT, DAILY_REVIEW_LIMIT } from '@/lib/constants'

const localExercises = exercisesData as Exercise[]

interface UseStudyReturn {
  currentCard: ReviewableCard | null
  schedulingOptions: SchedulingOptions | null
  cardsRemaining: number
  isLoading: boolean
  error: string | null
  reviewCard: (rating: 1 | 2 | 3 | 4, response?: string, wasCorrect?: boolean, timeTakenMs?: number) => Promise<void>
  skipCard: () => void
}

export function useStudy(user: User | null): UseStudyReturn {
  const [queue, setQueue] = useState<ReviewableCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentCard = queue[0] ?? null
  const schedulingOptions = currentCard ? getSchedulingOptions(currentCard.userCard) : null

  useEffect(() => {
    if (!user) return
    loadQueue(user.id)
  }, [user])

  async function loadQueue(userId: string) {
    setIsLoading(true)
    setError(null)
    try {
      const now = new Date().toISOString()

      // Fetch due review cards
      const { data: dueCards, error: dueErr } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId)
        .lte('due', now)
        .neq('state', 0)
        .order('due', { ascending: true })
        .limit(DAILY_REVIEW_LIMIT)

      if (dueErr) throw dueErr

      // Fetch new cards (state = 0, unreviewed)
      const { data: newCards, error: newErr } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('state', 0)
        .limit(DAILY_NEW_CARDS_LIMIT)

      if (newErr) throw newErr

      const allCards = [...(dueCards ?? []), ...(newCards ?? [])] as UserCard[]

      if (allCards.length === 0) {
        // Initialize cards for this user from local exercises
        await initializeUserCards(userId)
        return
      }

      const reviewable = buildReviewableCards(allCards)
      setQueue(reviewable)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study queue')
    } finally {
      setIsLoading(false)
    }
  }

  async function initializeUserCards(userId: string) {
    const toCreate = localExercises.slice(0, DAILY_NEW_CARDS_LIMIT)
    const emptyCard = createNewCard()
    const now = new Date().toISOString()

    const inserts = toCreate.map((_ex, i) => ({
      user_id: userId,
      content_type: 'exercise' as const,
      content_id: `local-exercise-${i}`,
      state: 0,
      due: now,
      stability: emptyCard.stability,
      difficulty: emptyCard.difficulty,
      elapsed_days: emptyCard.elapsed_days,
      scheduled_days: emptyCard.scheduled_days,
      reps: emptyCard.reps,
      lapses: emptyCard.lapses,
      last_review: null,
    }))

    const { data, error: insertErr } = await supabase
      .from('user_cards')
      .insert(inserts)
      .select()

    if (insertErr) {
      setError('Failed to initialize study cards')
      return
    }

    const reviewable = buildReviewableCards((data ?? []) as UserCard[])
    setQueue(reviewable)
  }

  function buildReviewableCards(cards: UserCard[]): ReviewableCard[] {
    return cards.map((card, i) => {
      const exercise = localExercises[i % localExercises.length]
      return {
        userCard: card,
        content: {
          front: exercise?.question ?? 'Practice exercise',
          back: exercise?.correct_answer ?? '',
          hint: exercise?.hint ?? undefined,
          explanation: exercise?.explanation ?? undefined,
          contentType: card.content_type,
          contentId: card.content_id,
        },
      }
    })
  }

  const reviewCard = useCallback(async (
    rating: 1 | 2 | 3 | 4,
    response?: string,
    wasCorrect?: boolean,
    timeTakenMs?: number
  ) => {
    if (!currentCard || !user) return

    const updatedFields = scheduleReview(currentCard.userCard, rating)

    // Update user_cards in Supabase
    const { error: updateErr } = await supabase
      .from('user_cards')
      .update({
        state: updatedFields.state,
        due: updatedFields.due.toISOString(),
        stability: updatedFields.stability,
        difficulty: updatedFields.difficulty,
        elapsed_days: updatedFields.elapsed_days,
        scheduled_days: updatedFields.scheduled_days,
        reps: updatedFields.reps,
        lapses: updatedFields.lapses,
        last_review: updatedFields.last_review?.toISOString() ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentCard.userCard.id)

    if (updateErr) {
      console.error('Failed to update card:', updateErr)
    }

    // Insert review log
    await supabase.from('review_logs').insert({
      user_id: user.id,
      card_id: currentCard.userCard.id,
      rating,
      response: response ?? null,
      was_correct: wasCorrect ?? null,
      time_taken_ms: timeTakenMs ?? null,
      reviewed_at: new Date().toISOString(),
    })

    // Advance queue
    setQueue(prev => prev.slice(1))
  }, [currentCard, user])

  function skipCard() {
    setQueue(prev => [...prev.slice(1), prev[0]])
  }

  return {
    currentCard,
    schedulingOptions,
    cardsRemaining: queue.length,
    isLoading,
    error,
    reviewCard,
    skipCard,
  }
}
