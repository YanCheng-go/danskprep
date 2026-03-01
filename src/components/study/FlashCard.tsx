import { useEffect, useRef } from 'react'
import type { ReviewableCard } from '@/types/study'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FlashCardProps {
  card: ReviewableCard
  revealed: boolean
  onReveal: () => void
  // Active recall props (only relevant when content.activeRecall is true)
  inputValue?: string
  onInputChange?: (value: string) => void
  onCheckAnswer?: () => void
  inputResult?: 'correct' | 'almost' | 'wrong' | null
}

const RESULT_COLORS = {
  correct: 'text-green-600 dark:text-green-400',
  almost:  'text-amber-600 dark:text-amber-400',
  wrong:   'text-destructive',
}

export function FlashCard({
  card,
  revealed,
  onReveal,
  inputValue = '',
  onInputChange,
  onCheckAnswer,
  inputResult,
}: FlashCardProps) {
  const { content } = card
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus the input each time a new active-recall card appears
  useEffect(() => {
    if (content.activeRecall && !revealed) {
      inputRef.current?.focus()
    }
  }, [content.activeRecall, revealed, card.userCard.id])

  return (
    <div className="space-y-4">

      {/* Front card — the question / prompt */}
      <Card>
        <CardContent className="p-6 text-center min-h-[140px] flex flex-col items-center justify-center gap-3">
          {content.hint && (
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              {content.hint}
            </p>
          )}
          <p className="text-lg font-medium leading-relaxed">{content.front}</p>
        </CardContent>
      </Card>

      {/* Active-recall mode: text input + Check button (before reveal) */}
      {content.activeRecall && !revealed && (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => onInputChange?.(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onCheckAnswer?.() }}
            placeholder="Skriv dit svar på dansk…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full border rounded-lg px-4 py-3 text-base bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            onClick={onCheckAnswer}
            className="w-full h-12 text-base"
            disabled={!inputValue.trim()}
          >
            Check
          </Button>
        </div>
      )}

      {/* Classic flashcard: Show-answer button (before reveal, non-active-recall) */}
      {!content.activeRecall && !revealed && (
        <Button
          variant="outline"
          className="w-full h-14 text-base"
          onClick={onReveal}
        >
          Show answer
        </Button>
      )}

      {/* Back card — revealed answer */}
      {revealed && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 text-center min-h-[100px] flex flex-col items-center justify-center gap-2">
            {content.activeRecall && inputResult && (
              <p className={cn('text-xs font-semibold uppercase tracking-wide', RESULT_COLORS[inputResult])}>
                {inputResult === 'correct' && '✓ Correct!'}
                {inputResult === 'almost'  && `≈ Almost — "${inputValue}" accepted`}
                {inputResult === 'wrong'   && `✗ You wrote: "${inputValue}"`}
              </p>
            )}
            <p className="text-lg font-semibold text-primary">{content.back}</p>
            {content.explanation && (
              <p className="text-sm text-muted-foreground mt-1">{content.explanation}</p>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
