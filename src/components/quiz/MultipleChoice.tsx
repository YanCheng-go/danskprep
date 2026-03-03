import { useMemo } from 'react'
import type { Exercise } from '@/types/quiz'
import { Button } from '@/components/ui/button'
import { cn, shuffle } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

interface MultipleChoiceProps {
  exercise: Exercise
  onSubmit: (response: string) => void
  disabled?: boolean
}

export function MultipleChoice({ exercise, onSubmit, disabled }: MultipleChoiceProps) {
  const { t } = useTranslation()

  const options = useMemo(() => {
    const all = [exercise.correct_answer, ...(exercise.alternatives ?? [])]
    return shuffle(all)
  }, [exercise.question, exercise.correct_answer, exercise.alternatives])

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
      {!disabled && (
        <Button
          variant="ghost"
          onClick={() => onSubmit('')}
          className="w-full text-muted-foreground"
        >
          {t('quiz.dontKnow')}
        </Button>
      )}
    </div>
  )
}
