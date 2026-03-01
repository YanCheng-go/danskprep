// Manually typed database types mirroring the Supabase schema.
// Run `npm run types` after connecting to Supabase to auto-generate from schema.

// ─── Noun inflections ───────────────────────────────────────────────────────
export interface NounInflections {
  definite: string
  plural_indef: string
  plural_def: string
}

// ─── Verb inflections ───────────────────────────────────────────────────────
export interface VerbInflections {
  present: string
  past: string
  perfect: string
  imperative: string
}

// ─── Adjective inflections ──────────────────────────────────────────────────
export interface AdjectiveInflections {
  t_form: string
  e_form: string
  comparative: string
  superlative: string
}

// ─── Pronoun inflections ────────────────────────────────────────────────────
export interface PronounInflections {
  subject: string
  object: string
  possessive: string[]
}

export type Inflections =
  | NounInflections
  | VerbInflections
  | AdjectiveInflections
  | PronounInflections
  | Record<string, string | string[]>

// ─── Words ──────────────────────────────────────────────────────────────────
export interface Word {
  id: string
  danish: string
  english: string
  part_of_speech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection'
  gender: 'en' | 'et' | null
  module_level: number
  difficulty: number
  tags: string[]
  inflections: Record<string, string | string[]> | null
  example_da: string | null
  example_en: string | null
  source: string
  created_at: string
}

// ─── Grammar Topics ─────────────────────────────────────────────────────────
export interface GrammarRule {
  rule: string
  example_da: string
  example_en: string
}

export interface GrammarTopicRow {
  id: string
  title: string
  slug: string
  module_level: number
  category: string
  explanation: string
  rules: GrammarRule[]
  tips: string[]
  common_mistakes: string[]
  sort_order: number
  created_at: string
}

// ─── Exercises ───────────────────────────────────────────────────────────────
export type ExerciseType =
  | 'type_answer'
  | 'cloze'
  | 'multiple_choice'
  | 'word_order'
  | 'error_correction'
  | 'matching'
  | 'conjugation'

export interface ExerciseRow {
  id: string
  grammar_topic_slug: string | null
  word_id: string | null
  exercise_type: ExerciseType
  question: string
  correct_answer: string
  acceptable_answers: string[]
  alternatives: string[] | null
  hint: string | null
  explanation: string | null
  module_level: number
  difficulty: number
  source: string
  created_at: string
}

// ─── Sentences ───────────────────────────────────────────────────────────────
export interface SentenceRow {
  id: string
  danish: string
  english: string
  grammar_topic_slug: string | null
  module_level: number
  difficulty: number
  cloze_word: string | null
  cloze_answer: string | null
  source: string
  created_at: string
}

// ─── User Cards (FSRS state) ─────────────────────────────────────────────────
export interface UserCard {
  id: string
  user_id: string
  content_type: 'word' | 'exercise' | 'sentence'
  content_id: string
  state: number        // 0=New, 1=Learning, 2=Review, 3=Relearning
  due: string          // ISO timestamp
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  last_review: string | null
  created_at: string
  updated_at: string
}

// ─── Review Logs ─────────────────────────────────────────────────────────────
export interface ReviewLog {
  id: string
  user_id: string
  card_id: string
  rating: number
  response: string | null
  was_correct: boolean | null
  time_taken_ms: number | null
  reviewed_at: string
}

// ─── Supabase Database type ──────────────────────────────────────────────────
// Supabase v2 generic format
export type Database = {
  public: {
    Tables: {
      words: {
        Row: Word
        Insert: Omit<Word, 'id' | 'created_at'>
        Update: Partial<Omit<Word, 'id' | 'created_at'>>
        Relationships: []
      }
      grammar_topics: {
        Row: GrammarTopicRow
        Insert: Omit<GrammarTopicRow, 'id' | 'created_at'>
        Update: Partial<Omit<GrammarTopicRow, 'id' | 'created_at'>>
        Relationships: []
      }
      exercises: {
        Row: ExerciseRow
        Insert: Omit<ExerciseRow, 'id' | 'created_at'>
        Update: Partial<Omit<ExerciseRow, 'id' | 'created_at'>>
        Relationships: []
      }
      sentences: {
        Row: SentenceRow
        Insert: Omit<SentenceRow, 'id' | 'created_at'>
        Update: Partial<Omit<SentenceRow, 'id' | 'created_at'>>
        Relationships: []
      }
      user_cards: {
        Row: UserCard
        Insert: Omit<UserCard, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserCard, 'id' | 'created_at'>>
        Relationships: []
      }
      review_logs: {
        Row: ReviewLog
        Insert: Omit<ReviewLog, 'id'>
        Update: Partial<Omit<ReviewLog, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
