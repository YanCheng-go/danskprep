import type { Word } from './database'
import type { AnswerResult, QuizStats } from './quiz'

export type DrillRoundType =
  | 'translation_en_da'   // English prompt → type Danish
  | 'translation_da_en'   // Danish prompt → type English
  | 'context_cloze'       // Cloze from example_da sentence
  | 'paradigm_fill'       // Fill one blank in inflection table
  | 'form_choice'         // Pick correct inflected form (2-3 options)

export interface DrillQuestion {
  id: string
  word: Word
  roundType: DrillRoundType
  prompt: string
  correctAnswer: string
  acceptableAnswers: string[]
  alternatives?: string[]      // for form_choice options
  hint?: string
  explanation?: string
  inflectionKey?: string       // for paradigm_fill: which form is tested
  /** Shown inflection entries for paradigm_fill (all except the tested one) */
  paradigmContext?: Record<string, string>
}

export interface DrillAnswer {
  question: DrillQuestion
  userResponse: string
  result: AnswerResult
  timeTakenMs: number
  isRetry: boolean
}

export interface DrillSession {
  questions: DrillQuestion[]
  answers: DrillAnswer[]
  startedAt: Date
  completedAt: Date | null
}

export interface DrillConfig {
  posFilter: ('noun' | 'verb' | 'adjective')[]  // empty = all
  roundTypes: DrillRoundType[]                    // empty = all
  questionCount: number                           // default 20
}

export interface DrillStats extends QuizStats {
  retriesPassed: number
  retriesFailed: number
  byRoundType: Record<DrillRoundType, { total: number; correct: number }>
}

export type { Word }
