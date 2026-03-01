import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserCard, ReviewLog } from '@/types/database'

interface ProgressStats {
  total: number
  newCards: number
  learning: number
  review: number
  relearning: number
  accuracyPercent: number
  streakDays: number
}

interface UseProgressReturn {
  stats: ProgressStats
  isLoading: boolean
  error: string | null
  refresh: () => void
}

const DEFAULT_STATS: ProgressStats = {
  total: 0,
  newCards: 0,
  learning: 0,
  review: 0,
  relearning: 0,
  accuracyPercent: 0,
  streakDays: 0,
}

export function useProgress(user: User | null): UseProgressReturn {
  const [stats, setStats] = useState<ProgressStats>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!user) {
      setStats(DEFAULT_STATS)
      return
    }
    fetchStats(user.id)
  }, [user, tick])

  async function fetchStats(userId: string) {
    setIsLoading(true)
    setError(null)
    try {
      // Card state counts
      const { data: rawCards, error: cardsErr } = await supabase
        .from('user_cards')
        .select('state')
        .eq('user_id', userId)

      if (cardsErr) throw cardsErr

      const cards = (rawCards ?? []) as Pick<UserCard, 'state'>[]
      const newCards = cards.filter(c => c.state === 0).length
      const learning = cards.filter(c => c.state === 1).length
      const review = cards.filter(c => c.state === 2).length
      const relearning = cards.filter(c => c.state === 3).length

      // Accuracy from review logs (last 30 days)
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: rawLogs, error: logsErr } = await supabase
        .from('review_logs')
        .select('was_correct, reviewed_at')
        .eq('user_id', userId)
        .gte('reviewed_at', since)

      if (logsErr) throw logsErr

      const logs = (rawLogs ?? []) as Pick<ReviewLog, 'was_correct' | 'reviewed_at'>[]
      const totalLogs = logs.length
      const correctLogs = logs.filter(l => l.was_correct === true).length
      const accuracyPercent =
        totalLogs === 0 ? 0 : Math.round((correctLogs / totalLogs) * 100)

      const streakDays = computeStreak(logs.map(l => l.reviewed_at))

      setStats({
        total: cards.length,
        newCards,
        learning,
        review,
        relearning,
        accuracyPercent,
        streakDays,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    stats,
    isLoading,
    error,
    refresh: () => setTick(t => t + 1),
  }
}

function computeStreak(reviewedAts: string[]): number {
  if (reviewedAts.length === 0) return 0

  const days = new Set(
    reviewedAts.map(d => new Date(d).toISOString().slice(0, 10))
  )
  const today = new Date().toISOString().slice(0, 10)

  let streak = 0
  let current = today

  while (days.has(current)) {
    streak++
    const d = new Date(current)
    d.setDate(d.getDate() - 1)
    current = d.toISOString().slice(0, 10)
  }

  return streak
}
