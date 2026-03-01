import { useEffect, useState } from 'react'
import type { ReviewableCard, SchedulingOptions } from '@/types/study'
import { checkAnswer } from '@/lib/answer-check'
import { Progress } from '@/components/ui/progress'
import { FlashCard } from './FlashCard'
import { CardRating } from './CardRating'

interface ReviewQueueProps {
  currentCard: ReviewableCard
  schedulingOptions: SchedulingOptions | null
  cardsRemaining: number
  totalCards: number
  onRate: (rating: 1 | 2 | 3 | 4, response?: string, wasCorrect?: boolean) => Promise<void>
}

export function ReviewQueue({
  currentCard,
  schedulingOptions,
  cardsRemaining,
  totalCards,
  onRate,
}: ReviewQueueProps) {
  const [revealed, setRevealed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Active recall state
  const [inputValue, setInputValue] = useState('')
  const [inputResult, setInputResult] = useState<'correct' | 'almost' | 'wrong' | null>(null)
  const [suggestedRating, setSuggestedRating] = useState<1 | 2 | 3 | 4 | null>(null)

  // Reset all state when card changes
  useEffect(() => {
    setRevealed(false)
    setInputValue('')
    setInputResult(null)
    setSuggestedRating(null)
  }, [currentCard.userCard.id])

  const reviewed = totalCards - cardsRemaining
  const progressPct = totalCards > 0 ? (reviewed / totalCards) * 100 : 0
  const isActiveRecall = !!currentCard.content.activeRecall

  function handleCheckAnswer() {
    if (!inputValue.trim()) return
    const result = checkAnswer(
      inputValue,
      currentCard.content.correctAnswer ?? currentCard.content.back,
      currentCard.content.acceptableAnswers ?? []
    )
    const outcome: 'correct' | 'almost' | 'wrong' =
      result.isCorrect ? 'correct' : result.isAlmostCorrect ? 'almost' : 'wrong'
    const rating: 1 | 2 | 3 | 4 =
      result.isCorrect ? 3 : result.isAlmostCorrect ? 2 : 1
    setInputResult(outcome)
    setSuggestedRating(rating)
    setRevealed(true)
  }

  async function handleRate(rating: 1 | 2 | 3 | 4) {
    setIsSubmitting(true)
    const wasCorrect = isActiveRecall ? inputResult === 'correct' || inputResult === 'almost' : undefined
    await onRate(rating, isActiveRecall ? inputValue : undefined, wasCorrect)
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{reviewed} reviewed</span>
          <span>{cardsRemaining} remaining</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* Card */}
      <FlashCard
        card={currentCard}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onCheckAnswer={handleCheckAnswer}
        inputResult={inputResult}
      />

      {/* Rating buttons — shown after reveal */}
      {revealed && (
        <CardRating
          schedulingOptions={schedulingOptions}
          onRate={handleRate}
          disabled={isSubmitting}
          suggestedRating={suggestedRating ?? undefined}
        />
      )}
    </div>
  )
}
