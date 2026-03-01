import type { DrillQuestion } from '@/types/drill'
import { cn } from '@/lib/utils'

interface FormChoiceRoundProps {
  question: DrillQuestion
  onSubmit: (response: string) => void
  disabled?: boolean
}

export function FormChoiceRound({ question, onSubmit, disabled }: FormChoiceRoundProps) {
  const options = question.alternatives ?? [question.correctAnswer]

  return (
    <div className="space-y-4">
      <p className="font-medium leading-relaxed">{question.prompt}</p>
      {question.hint && (
        <p className="text-sm text-muted-foreground italic">Hint: {question.hint}</p>
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
