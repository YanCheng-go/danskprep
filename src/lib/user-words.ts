import { SETTINGS_KEYS } from '@/lib/constants'

export interface UserWord {
  id: string
  danish: string
  english: string
  part_of_speech: string
  gender: 'en' | 'et' | null
  module_level: number
  difficulty: number
  tags: string[]
  inflections: Record<string, string | string[]> | null
  example_da: string | null
  example_en: string | null
  added_by: string          // user email or "anonymous"
  source: 'user-added'
  created_at: string
}

const STORAGE_KEY = SETTINGS_KEYS.USER_WORDS

function generateId(): string {
  return `uword-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getStored(): UserWord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(words: UserWord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words))
}

export function loadUserWords(): UserWord[] {
  return getStored()
}

export function addUserWord(
  data: Omit<UserWord, 'id' | 'source' | 'created_at'>
): UserWord {
  const words = getStored()

  // Deduplicate by danish headword (case-insensitive)
  const exists = words.some(
    w => w.danish.toLowerCase() === data.danish.toLowerCase()
  )
  if (exists) {
    throw new Error(`"${data.danish}" is already in your vocabulary`)
  }

  const word: UserWord = {
    ...data,
    id: generateId(),
    source: 'user-added',
    created_at: new Date().toISOString(),
  }
  words.push(word)
  save(words)
  return word
}

export function deleteUserWord(id: string): void {
  const words = getStored().filter(w => w.id !== id)
  save(words)
}

export function isWordSaved(danish: string): boolean {
  return getStored().some(
    w => w.danish.toLowerCase() === danish.toLowerCase()
  )
}

/**
 * Best-effort Supabase insert into user_words (private, RLS-protected).
 * Falls back silently if Supabase isn't configured.
 * localStorage remains the source of truth.
 */
export async function syncWordToSupabase(word: UserWord): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabase')
    if (!supabase) return // Supabase not configured

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return // Not logged in — skip DB sync

    await supabase.from('user_words').upsert(
      {
        user_id: user.id,
        danish: word.danish,
        english: word.english,
        part_of_speech: word.part_of_speech,
        gender: word.gender,
        module_level: word.module_level,
        difficulty: word.difficulty,
        tags: word.tags,
        inflections: word.inflections,
        example_da: word.example_da,
        example_en: word.example_en,
        source: 'user-added',
      },
      { onConflict: 'user_id,danish' }
    )
  } catch {
    // Insert failed — localStorage is the fallback
  }
}

/**
 * Load user words from Supabase for the authenticated user.
 * Returns empty array if Supabase is not configured or user is not logged in.
 */
export async function loadUserWordsFromSupabase(): Promise<UserWord[]> {
  try {
    const { supabase } = await import('@/lib/supabase')
    if (!supabase) return []

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('user_words')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row): UserWord => ({
      id: row.id,
      danish: row.danish,
      english: row.english,
      part_of_speech: row.part_of_speech,
      gender: row.gender ?? null,
      module_level: row.module_level,
      difficulty: row.difficulty ?? 1,
      tags: row.tags ?? [],
      inflections: row.inflections ?? null,
      example_da: row.example_da ?? null,
      example_en: row.example_en ?? null,
      added_by: user.email ?? 'anonymous',
      source: 'user-added',
      created_at: row.created_at,
    }))
  } catch {
    return []
  }
}
