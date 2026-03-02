import { useCallback, useEffect, useMemo, useState } from 'react'
import wordsData from '@/data/seed/words-pd3m2.json'
import type { Word } from '@/types/database'
import { loadUserWords, loadUserWordsFromSupabase } from '@/lib/user-words'
import type { UserWord } from '@/lib/user-words'

// The JSON uses the same shape as Word but without id/created_at
type SeedWord = Omit<Word, 'id' | 'created_at'> & { id?: string; created_at?: string }
const seedWords = (wordsData as SeedWord[]).map((w, i) => ({
  ...w,
  id: w.id ?? `local-word-${i}`,
  created_at: w.created_at ?? new Date().toISOString(),
})) as Word[]

function userWordToWord(uw: UserWord): Word {
  return {
    id: uw.id,
    danish: uw.danish,
    english: uw.english,
    part_of_speech: (uw.part_of_speech || 'noun') as Word['part_of_speech'],
    gender: uw.gender,
    module_level: uw.module_level,
    difficulty: uw.difficulty,
    tags: uw.tags,
    inflections: uw.inflections,
    example_da: uw.example_da,
    example_en: uw.example_en,
    source: 'user-added',
    created_at: uw.created_at,
  }
}

/** Merge localStorage + Supabase user words, dedup by danish (case-insensitive) */
function deduplicateUserWords(local: UserWord[], remote: UserWord[]): UserWord[] {
  const seen = new Set<string>()
  const merged: UserWord[] = []
  // Remote (Supabase) takes precedence — add first
  for (const w of remote) {
    const key = w.danish.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(w)
    }
  }
  // Then add local-only words
  for (const w of local) {
    const key = w.danish.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(w)
    }
  }
  return merged
}

interface UseWordsReturn {
  words: Word[]
  seedWords: Word[]
  filteredWords: Word[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  posFilter: string
  setPosFilter: (pos: string) => void
  getWord: (id: string) => Word | undefined
  refreshUserWords: () => void
}

export function useWords(): UseWordsReturn {
  const [searchTerm, setSearchTerm] = useState('')
  const [posFilter, setPosFilter] = useState('')
  const [userAddedWords, setUserAddedWords] = useState<Word[]>(
    () => loadUserWords().map(userWordToWord)
  )

  // On mount, try loading from Supabase and merge with localStorage
  useEffect(() => {
    let cancelled = false
    loadUserWordsFromSupabase().then(remoteWords => {
      if (cancelled) return
      if (remoteWords.length > 0) {
        const localWords = loadUserWords()
        const merged = deduplicateUserWords(localWords, remoteWords)
        setUserAddedWords(merged.map(userWordToWord))
      }
    })
    return () => { cancelled = true }
  }, [])

  const refreshUserWords = useCallback(() => {
    setUserAddedWords(loadUserWords().map(userWordToWord))
  }, [])

  const allWords = useMemo(
    () => [...seedWords, ...userAddedWords],
    [userAddedWords]
  )

  const filteredWords = useMemo(() => {
    let result = allWords
    if (posFilter) {
      result = result.filter(w => w.part_of_speech === posFilter)
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      result = result.filter(
        w =>
          w.danish.toLowerCase().includes(q) ||
          w.english.toLowerCase().includes(q)
      )
    }
    return result
  }, [allWords, searchTerm, posFilter])

  function getWord(id: string): Word | undefined {
    return allWords.find(w => w.id === id)
  }

  return {
    words: allWords,
    seedWords,
    filteredWords,
    searchTerm,
    setSearchTerm,
    posFilter,
    setPosFilter,
    getWord,
    refreshUserWords,
  }
}
