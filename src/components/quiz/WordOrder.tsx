import { useMemo, useState } from 'react'
import type { Exercise } from '@/types/quiz'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface WordOrderProps {
  exercise: Exercise
  onSubmit: (response: string) => void
  disabled?: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function WordOrder({ exercise, onSubmit, disabled }: WordOrderProps) {
  // Parse word chips from question (format: "word1 / word2 / word3 / word4")
  const wordBank = useMemo(() => {
    const raw = exercise.question.replace(/^Put in correct order:\s*/i, '')
    const words = raw.split(/\s*\/\s*/)
    return shuffle(words).map((w, i) => ({ id: i, word: w }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.question])

  const [selected, setSelected] = useState<Array<{ id: number; word: string }>>([])
  const remaining = wordBank.filter(w => !selected.find(s => s.id === w.id))

  function addWord(item: { id: number; word: string }) {
    setSelected(prev => [...prev, item])
  }

  function removeWord(id: number) {
    setSelected(prev => prev.filter(s => s.id !== id))
  }

  function handleSubmit() {
    const answer = selected.map(s => s.word).join(' ')
    onSubmit(answer)
  }

  return (
    <div className="space-y-4">
      <p className="font-medium">Arrange the words into a correct sentence:</p>

      {/* Answer area */}
      <div className="min-h-[52px] rounded-lg border-2 border-dashed border-border p-3 flex flex-wrap gap-2">
        {selected.length === 0 && (
          <p className="text-sm text-muted-foreground self-center">Tap words below to add them</p>
        )}
        {selected.map(item => (
          <button
            key={item.id}
            onClick={() => removeWord(item.id)}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary border border-primary/20 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            {item.word}
            <X className="h-3 w-3" />
          </button>
        ))}
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2">
        {remaining.map(item => (
          <button
            key={item.id}
            onClick={() => addWord(item)}
            disabled={disabled}
            className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors min-h-9"
          >
            {item.word}
          </button>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={selected.length === 0 || disabled}
        className="w-full"
      >
        Check order
      </Button>
    </div>
  )
}
