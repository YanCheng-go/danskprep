import { useMemo, useState } from 'react'
import wordsData from '@/data/seed/words-pd3m2.json'
import type { Word } from '@/types/database'

// The JSON uses the same shape as Word but without id/created_at
type SeedWord = Omit<Word, 'id' | 'created_at'> & { id?: string; created_at?: string }
const allWords = (wordsData as SeedWord[]).map((w, i) => ({
  ...w,
  id: w.id ?? `local-word-${i}`,
  created_at: w.created_at ?? new Date().toISOString(),
})) as Word[]

interface UseWordsReturn {
  words: Word[]
  filteredWords: Word[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  posFilter: string
  setPosFilter: (pos: string) => void
  getWord: (id: string) => Word | undefined
}

export function useWords(): UseWordsReturn {
  const [searchTerm, setSearchTerm] = useState('')
  const [posFilter, setPosFilter] = useState('')

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
  }, [searchTerm, posFilter])

  function getWord(id: string): Word | undefined {
    return allWords.find(w => w.id === id)
  }

  return {
    words: allWords,
    filteredWords,
    searchTerm,
    setSearchTerm,
    posFilter,
    setPosFilter,
    getWord,
  }
}
