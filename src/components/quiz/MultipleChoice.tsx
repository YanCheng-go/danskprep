import { useMemo } from 'react'
import type { Exercise } from '@/types/quiz'
import { cn } from '@/lib/utils'

interface MultipleChoiceProps {
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

export function MultipleChoice({ exercise, onSubmit, disabled }: MultipleChoiceProps) {
  const options = useMemo(() => {
    const all = [exercise.correct_answer, ...(exercise.alternatives ?? [])]
    return shuffle(all)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.question])

  return (
    <div className="space-y-4">
      <p className="font-medium leading-relaxed">{exercise.question}</p>
      {exercise.hint && (
        <p className="text-sm text-muted-foreground italic">Hint: {exercise.hint}</p>
      )}
      <div className="space-y-2">
        {options.map(option => (
          <button
            key={option}
            onClick={() => !disabled && onSubmit(option)}
            disabled={disabled}
            className={cn(
              'w-full text-left rounded-lg border px-4 py-3 text-sm font-medium transition-colors min-h-11',
              'hover:bg-accent hover:text-accent-foreground',
              'disabled:opacity-50 disabled:pointer-events-none'
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
