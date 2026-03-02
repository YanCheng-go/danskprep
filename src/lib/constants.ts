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
} as const
