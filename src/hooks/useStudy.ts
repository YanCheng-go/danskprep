import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { scheduleReview, getSchedulingOptions, createNewCard } from '@/lib/fsrs'
import type { UserCard, Word } from '@/types/database'
import type { ReviewableCard, SchedulingOptions } from '@/types/study'
import type { Exercise } from '@/types/quiz'
import exercisesData from '@/data/seed/exercises-pd3m2.json'
import wordsData from '@/data/seed/words-pd3m2.json'
import { DAILY_NEW_CARDS_LIMIT, DAILY_REVIEW_LIMIT } from '@/lib/constants'

const localExercises = exercisesData as Exercise[]
// Strip id/created_at that are absent in the seed file
type SeedWord = Omit<Word, 'id' | 'created_at'> & { id?: string; created_at?: string }
const localWords = (wordsData as SeedWord[]).map((w, i) => ({
  ...w,
  id: w.id ?? `local-word-${i}`,
  created_at: w.created_at ?? new Date().toISOString(),
})) as Word[]

interface UseStudyReturn {
  currentCard: ReviewableCard | null
  schedulingOptions: SchedulingOptions | null
  cardsRemaining: number
  isLoading: boolean
  error: string | null
  reviewCard: (rating: 1 | 2 | 3 | 4, response?: string, wasCorrect?: boolean, timeTakenMs?: number) => Promise<void>
  skipCard: () => void
}

export function useStudy(user: User | null, mode: 'daily' | 'all' = 'daily'): UseStudyReturn {
  const [queue, setQueue] = useState<ReviewableCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentCard = queue[0] ?? null
  const schedulingOptions = currentCard ? getSchedulingOptions(currentCard.userCard) : null

  useEffect(() => {
    if (!user) return
    loadQueue(user.id)
  }, [user, mode])

  async function loadQueue(userId: string) {
    setIsLoading(true)
    setError(null)
    try {
      if (mode === 'daily') {
        await loadDailyQueue(userId)
      } else {
        await loadAllQueue(userId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study queue')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadDailyQueue(userId: string) {
    const now = new Date().toISOString()

    const { data: dueCards, error: dueErr } = await supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', userId)
      .lte('due', now)
      .neq('state', 0)
      .order('due', { ascending: true })
      .limit(DAILY_REVIEW_LIMIT)

    if (dueErr) throw dueErr

    const { data: newCards, error: newErr } = await supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('state', 0)
      .limit(DAILY_NEW_CARDS_LIMIT)

    if (newErr) throw newErr

    const allCards = [...(dueCards ?? []), ...(newCards ?? [])] as UserCard[]

    if (allCards.length === 0) {
      await initializeUserCards(userId)
      return
    }

    const reviewable = buildReviewableCards(allCards)
    setQueue(reviewable)
  }

  async function loadAllQueue(userId: string) {
    const { data: existingCards, error: fetchErr } = await supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', userId)
      .order('content_id', { ascending: true })

    if (fetchErr) throw fetchErr

    const existing = (existingCards ?? []) as UserCard[]

    if (existing.length === 0) {
      await initializeUserCards(userId)
      return
    }

    const existingIds = new Set(existing.map(c => c.content_id))
    const topped = await topUpUserCards(userId, existingIds)

    const allCards = [...existing, ...topped]
    const reviewable = buildReviewableCards(allCards)
    setQueue(reviewable)
  }

  async function initializeUserCards(userId: string) {
    const emptyCard = createNewCard()
    const now = new Date().toISOString()

    const exerciseInserts = localExercises.map((_ex, i) => ({
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

    const wordInserts = localWords.map((_w, i) => ({
      user_id: userId,
      content_type: 'word' as const,
      content_id: `local-word-${i}`,
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
      .insert([...exerciseInserts, ...wordInserts])
      .select()

    if (insertErr) {
      setError('Failed to initialize study cards')
      return
    }

    const reviewable = buildReviewableCards((data ?? []) as UserCard[])
    setQueue(reviewable)
  }

  async function topUpUserCards(userId: string, existingIds: Set<string>): Promise<UserCard[]> {
    const emptyCard = createNewCard()
    const now = new Date().toISOString()

    const missingExercises = localExercises
      .map((_ex, i) => ({ content_type: 'exercise' as const, content_id: `local-exercise-${i}` }))
      .filter(c => !existingIds.has(c.content_id))

    const missingWords = localWords
      .map((_w, i) => ({ content_type: 'word' as const, content_id: `local-word-${i}` }))
      .filter(c => !existingIds.has(c.content_id))

    const missing = [...missingExercises, ...missingWords]
    if (missing.length === 0) return []

    const inserts = missing.map(({ content_type, content_id }) => ({
      user_id: userId,
      content_type,
      content_id,
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
      console.error('Failed to top up user cards:', insertErr)
      return []
    }

    return (data ?? []) as UserCard[]
  }

  function buildReviewableCards(cards: UserCard[]): ReviewableCard[] {
    return cards.map(card => {
      if (card.content_type === 'word') {
        return buildWordReviewableCard(card)
      }
      // Exercise card — derive index from content_id
      const index = parseInt(card.content_id.replace('local-exercise-', ''), 10)
      const exercise = localExercises[index] ?? localExercises[0]
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

  function buildWordReviewableCard(card: UserCard): ReviewableCard {
    const index = parseInt(card.content_id.replace('local-word-', ''), 10)
    const word = localWords[index] ?? localWords[0]
    const inf = word.inflections as Record<string, string | string[]> | null

    let front = word.danish
    if (word.part_of_speech === 'verb') front = `at ${word.danish}`
    else if (word.gender) front = `${word.gender} ${word.danish}`

    let explanation: string | undefined
    if (inf) {
      if (word.part_of_speech === 'verb') {
        explanation = [inf['present'], inf['past'], inf['perfect'], inf['imperative']]
          .filter(Boolean).map(String).join('  •  ')
      } else if (word.part_of_speech === 'adjective') {
        explanation = [
          `t: ${inf['t_form'] ?? ''}`,
          `e: ${inf['e_form'] ?? ''}`,
          inf['comparative'] ? `komp: ${inf['comparative']}` : null,
          inf['superlative'] ? `sup: ${inf['superlative']}` : null,
        ].filter(Boolean).join('  •  ')
      } else if (word.part_of_speech === 'noun') {
        explanation = [inf['definite'], inf['plural_indef'], inf['plural_def']]
          .filter(Boolean).map(String).join('  •  ')
      }
    }

    return {
      userCard: card,
      content: {
        front,
        back: word.english,
        hint: word.example_da ?? undefined,
        explanation: explanation || undefined,
        contentType: 'word',
        contentId: card.content_id,
      },
    }
  }

  const reviewCard = useCallback(async (
    rating: 1 | 2 | 3 | 4,
    response?: string,
    wasCorrect?: boolean,
    timeTakenMs?: number
  ) => {
    if (!currentCard || !user) return

    const updatedFields = scheduleReview(currentCard.userCard, rating)

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

    await supabase.from('review_logs').insert({
      user_id: user.id,
      card_id: currentCard.userCard.id,
      rating,
      response: response ?? null,
      was_correct: wasCorrect ?? null,
      time_taken_ms: timeTakenMs ?? null,
      reviewed_at: new Date().toISOString(),
    })

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
