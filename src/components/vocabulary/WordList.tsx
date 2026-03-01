import { useState } from 'react'
import type { Word } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { WordDetail } from './WordDetail'
import { Search } from 'lucide-react'

interface WordListProps {
  words: Word[]
  searchTerm: string
  onSearchChange: (term: string) => void
  posFilter: string
  onPosChange: (pos: string) => void
}

const POS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'noun', label: 'Nouns' },
  { value: 'verb', label: 'Verbs' },
  { value: 'adjective', label: 'Adjectives' },
  { value: 'pronoun', label: 'Pronouns' },
  { value: 'adverb', label: 'Adverbs' },
]

export function WordList({ words, searchTerm, onSearchChange, posFilter, onPosChange }: WordListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search Danish or English…"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* POS filter */}
      <div className="flex flex-wrap gap-2">
        {POS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onPosChange(opt.value)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              posFilter === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Word count */}
      <p className="text-xs text-muted-foreground">{words.length} words</p>

      {/* Word rows */}
      <div className="divide-y border rounded-lg overflow-hidden">
        {words.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">No words found</p>
        ) : (
          words.map(word => (
            <div key={word.id}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedId(prev => prev === word.id ? null : word.id)}
              >
                <div className="flex items-center gap-3">
                  {word.gender && (
                    <span className={`text-xs font-mono font-bold w-6 ${word.gender === 'en' ? 'text-blue-500' : 'text-orange-500'}`}>
                      {word.gender}
                    </span>
                  )}
                  <span className="font-medium text-sm">{word.danish}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{word.english}</span>
                  <Badge variant="outline" className="text-xs hidden sm:flex">
                    {word.part_of_speech}
                  </Badge>
                </div>
              </button>
              {expandedId === word.id && (
                <div className="px-4 pb-3 bg-muted/30">
                  <WordDetail word={word} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
