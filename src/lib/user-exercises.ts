import { SETTINGS_KEYS } from '@/lib/constants'
import { normalizeDanish, damerauLevenshtein } from '@/lib/answer-check'
import type { Exercise } from '@/types/quiz'
import type { ExerciseType } from '@/types/database'

export interface UserExercise {
  id: string
  exercise_type: ExerciseType
  grammar_topic_slug: string | null
  question: string
  correct_answer: string
  acceptable_answers: string[]
  alternatives: string[] | null
  hint: string | null
  explanation: string | null
  module_level: number
  difficulty: 1 | 2 | 3
  shared: boolean  // false = private (default), true = shared publicly
  source: 'user-added'
  created_at: string
}

function generateId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getStoredExercises(): UserExercise[] {
  try {
    const raw = localStorage.getItem(SETTINGS_KEYS.USER_EXERCISES)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveExercises(exercises: UserExercise[]): void {
  localStorage.setItem(SETTINGS_KEYS.USER_EXERCISES, JSON.stringify(exercises))
}

export function loadUserExercises(): UserExercise[] {
  return getStoredExercises()
}

export function addUserExercise(
  data: Omit<UserExercise, 'id' | 'source' | 'created_at'>
): UserExercise {
  const exercises = getStoredExercises()
  const exercise: UserExercise = {
    ...data,
    id: generateId(),
    shared: data.shared ?? false,
    source: 'user-added',
    created_at: new Date().toISOString(),
  }
  exercises.push(exercise)
  saveExercises(exercises)
  return exercise
}

export function deleteUserExercise(id: string): void {
  const exercises = getStoredExercises().filter(e => e.id !== id)
  saveExercises(exercises)
}

/**
 * Check if a question is a near-duplicate of existing exercises.
 * Uses Damerau-Levenshtein on normalized question text.
 */
export function isDuplicateQuestion(
  question: string,
  existingExercises: Array<{ question: string }>
): boolean {
  const normalizedNew = normalizeDanish(question)
  if (normalizedNew.length < 5) return false

  return existingExercises.some(e => {
    const normalizedExisting = normalizeDanish(e.question)
    if (normalizedNew === normalizedExisting) return true
    // Allow distance of 2 for near-dupes on longer questions
    if (normalizedNew.length > 20) {
      return damerauLevenshtein(normalizedNew, normalizedExisting) <= 2
    }
    return false
  })
}

/** Convert UserExercise to Exercise format for quiz/drill use */
export function toExercise(ue: UserExercise): Exercise {
  return {
    id: ue.id,
    exercise_type: ue.exercise_type,
    grammar_topic_slug: ue.grammar_topic_slug,
    question: ue.question,
    correct_answer: ue.correct_answer,
    acceptable_answers: ue.acceptable_answers,
    alternatives: ue.alternatives,
    hint: ue.hint,
    explanation: ue.explanation,
    module_level: ue.module_level,
    difficulty: ue.difficulty,
  }
}
