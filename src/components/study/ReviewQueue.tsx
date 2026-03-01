import { useState } from 'react'
import type { ReviewableCard, SchedulingOptions } from '@/types/study'
import { Progress } from '@/components/ui/progress'
import { FlashCard } from './FlashCard'
import { CardRating } from './CardRating'

interface ReviewQueueProps {
  currentCard: ReviewableCard
  schedulingOptions: SchedulingOptions | null
  cardsRemaining: number
  totalCards: number
  onRate: (rating: 1 | 2 | 3 | 4) => Promise<void>
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

  const reviewed = totalCards - cardsRemaining
  const progressPct = totalCards > 0 ? (reviewed / totalCards) * 100 : 0

  async function handleRate(rating: 1 | 2 | 3 | 4) {
    setIsSubmitting(true)
    await onRate(rating)
    setRevealed(false)
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
      />

      {/* Rating buttons — only after reveal */}
      {revealed && (
        <CardRating
          schedulingOptions={schedulingOptions}
          onRate={handleRate}
          disabled={isSubmitting}
        />
      )}
    </div>
  )
}
