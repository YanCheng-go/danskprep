export const APP_VERSION = '0.9.1'

// Feature flags
// CI trigger: markdown-only PRs don't run the typecheck workflow
export const FEATURES = {
  DICT_ADD_TO_VOCAB: false, // Dictionary → Add to vocabulary (WIP)
} as const

export const DAILY_NEW_CARDS_LIMIT = 20
export const DAILY_REVIEW_LIMIT = 50
export const DESIRED_RETENTION = 0.9

export const MODULE_LEVELS = [1, 2, 3, 4, 5] as const
export type ModuleLevel = (typeof MODULE_LEVELS)[number]

export const GRAMMAR_TOPIC_SLUGS = [
  'noun-gender',
  'comparative-superlative',
  'inverted-word-order',
  'main-subordinate-clauses',
  'verbs-tenses',
  'pronouns',
  'adjective-agreement',
] as const

export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  type_answer: 'Type Answer',
  cloze: 'Fill in the Blank',
  multiple_choice: 'Multiple Choice',
  word_order: 'Word Order',
  error_correction: 'Error Correction',
  matching: 'Matching',
  conjugation: 'Conjugation',
}

export const RATING_LABELS: Record<number, string> = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
}

export const DRILL_ROUND_TYPE_LABELS: Record<string, string> = {
  translation_en_da: 'EN → DA',
  translation_da_en: 'DA → EN',
  context_cloze: 'Context Cloze',
  paradigm_fill: 'Paradigm Fill',
  form_choice: 'Form Choice',
}

export const SETTINGS_KEYS = {
  DAILY_NEW_LIMIT: 'danskprep_daily_new_limit',
  ACCEPT_LATIN_FALLBACK: 'danskprep_accept_latin',
  DARK_MODE: 'danskprep_dark_mode',
  ACTIVE_MODULE: 'danskprep_active_module',
  USER_EXERCISES: 'danskprep_user_exercises',
  USER_WORDS: 'danskprep_user_words',
  LOCALE: 'danskprep_locale',
  AI_PROVIDER: 'danskprep_ai_provider',
  AI_MODEL: 'danskprep_ai_model',
  ANTHROPIC_KEY: 'danskprep_anthropic_api_key',
  OLLAMA_URL: 'danskprep_ollama_url',
  OPENROUTER_KEY: 'danskprep_openrouter_key',
  OPENAI_KEY: 'danskprep_openai_api_key',
  QUIZ_MAX_QUESTIONS: 'danskprep_quiz_max_questions',
  WELCOME_SEEN: 'danskprep_welcome_seen',
  BUBBLE_NICKNAME: 'danskprep_bubble_nickname',
  BUBBLE_SCORES: 'danskprep_bubble_scores',
} as const

export interface ModuleInfo {
  id: string
  label: string
  shortLabel: string
  hasContent: boolean
}

export const AVAILABLE_MODULES: ModuleInfo[] = [
  { id: 'pd3m1', label: 'PD3 Module 1', shortLabel: 'PD3 M1', hasContent: false },
  { id: 'pd3m2', label: 'PD3 Module 2', shortLabel: 'PD3 M2', hasContent: true },
]

export const DEFAULT_MODULE = 'pd3m2'
