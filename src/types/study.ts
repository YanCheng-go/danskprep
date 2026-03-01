import type { Card, Rating, State } from 'ts-fsrs'
import type { UserCard } from './database'

// A card ready for review — combines FSRS state with displayable content
export interface ReviewableCard {
  userCard: UserCard
  content: ReviewContent
}

export interface ReviewContent {
  front: string   // What to show before reveal
  back: string    // What to show after reveal
  hint?: string
  explanation?: string
  contentType: 'word' | 'exercise' | 'sentence'
  contentId: string
  // Active recall: show text input instead of flip-reveal
  activeRecall?: boolean
  correctAnswer?: string          // Primary correct answer string
  acceptableAnswers?: string[]    // Alternative accepted spellings
}

export interface SchedulingOption {
  card: Card
  intervalDays: number
  label: string  // e.g. "< 1 min", "10 min", "3 days"
}

// Keyed by the 4 user-facing ratings (Again=1, Hard=2, Good=3, Easy=4)
export type SchedulingOptions = Record<1 | 2 | 3 | 4, SchedulingOption>

// For converting between DB rows and ts-fsrs Card objects
export interface FsrsCardFields {
  state: State
  due: Date
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  last_review: Date | null
}

export { Rating, State }
