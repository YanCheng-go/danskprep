import { useMemo } from 'react'
import grammarData from '@/data/seed/grammar-pd3m2.json'
import type { GrammarTopic } from '@/types/grammar'

const topics = grammarData as GrammarTopic[]

interface UseGrammarReturn {
  topics: GrammarTopic[]
  getTopic: (slug: string) => GrammarTopic | undefined
}

export function useGrammar(): UseGrammarReturn {
  const sortedTopics = useMemo(
    () => [...topics].sort((a, b) => a.sort_order - b.sort_order),
    []
  )

  function getTopic(slug: string): GrammarTopic | undefined {
    return sortedTopics.find(t => t.slug === slug)
  }

  return { topics: sortedTopics, getTopic }
}
