import type { AnswerResult } from '@/types/quiz'
import type { Exercise } from '@/types/quiz'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface FeedbackPanelProps {
  result: AnswerResult
  userResponse: string
  exercise: Exercise
  onNext: () => void
  isLast: boolean
}

export function FeedbackPanel({ result, userResponse, exercise, onNext, isLast }: FeedbackPanelProps) {
  const isCorrect = result.isCorrect
  const isAlmost = result.isAlmostCorrect

  return (
    <div
      className={cn(
        'rounded-lg border p-4 space-y-3',
        isCorrect
          ? 'border-green-400 bg-green-50 dark:bg-green-950/30'
          : isAlmost
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30'
          : 'border-red-400 bg-red-50 dark:bg-red-950/30'
      )}
    >
      <div className="flex items-center gap-2">
        {isCorrect ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : isAlmost ? (
          <AlertCircle className="h-5 w-5 text-yellow-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        <span className={cn(
          'font-semibold text-sm',
          isCorrect ? 'text-green-700 dark:text-green-400'
          : isAlmost ? 'text-yellow-700 dark:text-yellow-400'
          : 'text-red-700 dark:text-red-400'
        )}>
          {isCorrect ? 'Correct!' : isAlmost ? 'Almost — check spelling' : 'Incorrect'}
        </span>
      </div>

      {!isCorrect && (
        <div className="text-sm space-y-1">
          <p className="text-muted-foreground">
            Your answer: <span className="font-mono text-foreground">{userResponse || '(empty)'}</span>
          </p>
          <p className="text-muted-foreground">
            Correct answer: <span className="font-mono font-medium text-foreground">{exercise.correct_answer}</span>
          </p>
        </div>
      )}

      {exercise.explanation && (
        <p className="text-sm text-muted-foreground border-t pt-2">{exercise.explanation}</p>
      )}

      <Button onClick={onNext} className="w-full">
        {isLast ? 'See results' : 'Next question'}
      </Button>
    </div>
  )
}
