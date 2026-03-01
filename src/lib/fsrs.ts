import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
} from 'ts-fsrs'
import type { UserCard } from '@/types/database'
import type { FsrsCardFields, SchedulingOption, SchedulingOptions } from '@/types/study'
import { DESIRED_RETENTION } from './constants'

const params = generatorParameters({ request_retention: DESIRED_RETENTION })
const f = fsrs(params)

/** Create a brand-new FSRS card (state = New). */
export function createNewCard(): Card {
  return createEmptyCard()
}

/** Convert a DB UserCard row into a ts-fsrs Card object. */
export function dbToFsrsCard(userCard: UserCard): Card {
  return {
    due: new Date(userCard.due),
    stability: userCard.stability,
    difficulty: userCard.difficulty,
    elapsed_days: userCard.elapsed_days,
    scheduled_days: userCard.scheduled_days,
    reps: userCard.reps,
    lapses: userCard.lapses,
    state: userCard.state as State,
    last_review: userCard.last_review ? new Date(userCard.last_review) : undefined,
  } as Card
}

/** Convert a ts-fsrs Card back to DB-compatible fields. */
export function fsrsCardToDb(card: Card): FsrsCardFields {
  return {
    state: card.state,
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    last_review: card.last_review ?? null,
  }
}

/** Get scheduling results for all 4 user-facing ratings. */
export function getSchedulingOptions(userCard: UserCard): SchedulingOptions {
  const card = dbToFsrsCard(userCard)
  const now = new Date()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recordLog: any = f.repeat(card, now)

  return {
    1: buildOption(recordLog[Rating.Again].card),
    2: buildOption(recordLog[Rating.Hard].card),
    3: buildOption(recordLog[Rating.Good].card),
    4: buildOption(recordLog[Rating.Easy].card),
  }
}

/** Apply a rating and return the updated card fields for DB storage. */
export function scheduleReview(userCard: UserCard, rating: 1 | 2 | 3 | 4): FsrsCardFields {
  const card = dbToFsrsCard(userCard)
  const now = new Date()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recordLog: any = f.repeat(card, now)
  return fsrsCardToDb(recordLog[rating].card)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildOption(card: Card): SchedulingOption {
  return {
    card,
    intervalDays: card.scheduled_days,
    label: formatInterval(card),
  }
}

function formatInterval(card: Card): string {
  const days = card.scheduled_days
  if (days < 1) {
    const minutesUntilDue = Math.round(
      (card.due.getTime() - Date.now()) / 60000
    )
    if (minutesUntilDue < 1) return '< 1 min'
    if (minutesUntilDue < 60) return `${minutesUntilDue} min`
    return `${Math.round(minutesUntilDue / 60)} hr`
  }
  if (days === 1) return '1 day'
  if (days < 31) return `${days} days`
  if (days < 365) return `${Math.round(days / 30)} mo`
  return `${Math.round(days / 365)} yr`
}

export { Rating, State }
