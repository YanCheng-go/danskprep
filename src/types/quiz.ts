import type { ExerciseType } from './database'

// Exercise as used in quiz sessions (from seed JSON or DB)
export interface Exercise {
  id?: string
  grammar_topic_slug: string | null
  word_id?: string | null
  exercise_type: ExerciseType
  question: string
  correct_answer: string
  acceptable_answers: string[]
  alternatives?: string[] | null
  hint?: string | null
  explanation?: string | null
  module_level: number
  difficulty: 1 | 2 | 3
}

// Answer check result
export interface AnswerResult {
  isCorrect: boolean
  isAlmostCorrect: boolean   // typo / edit distance ≤ 1
  normalizedUser: string
  normalizedCorrect: string
}

// One question-answer pair within a session
export interface QuizAnswer {
  exercise: Exercise
  userResponse: string
  result: AnswerResult
  timeTakenMs: number
}

// Full quiz session
export interface QuizSession {
  exercises: Exercise[]
  answers: QuizAnswer[]
  startedAt: Date
  completedAt: Date | null
}

// Session statistics
export interface QuizStats {
  total: number
  correct: number
  almostCorrect: number
  incorrect: number
  accuracyPercent: number
}

export type { ExerciseType }
