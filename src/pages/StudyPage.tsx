import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useStudy } from '@/hooks/useStudy'
import { PageContainer } from '@/components/layout/PageContainer'
import { ReviewQueue } from '@/components/study/ReviewQueue'
import { Skeleton } from '@/components/ui/skeleton'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function StudyPage() {
  const { user } = useAuth()
  const [totalCards, setTotalCards] = useState<number | null>(null)
  const { currentCard, schedulingOptions, cardsRemaining, isLoading, error, reviewCard } =
    useStudy(user)

  // Track total on first load
  if (totalCards === null && cardsRemaining > 0) {
    setTotalCards(cardsRemaining)
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <div className="text-center py-12 space-y-3">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </PageContainer>
    )
  }

  if (!currentCard) {
    return (
      <PageContainer>
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-semibold">All done for today!</h2>
          <p className="text-muted-foreground text-sm">
            No cards due. Come back tomorrow to keep your streak going.
          </p>
          <Link
            to="/quiz"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Practice with Quiz instead
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Study</h1>
        <p className="text-muted-foreground text-sm mt-1">Daily review</p>
      </div>
      <ReviewQueue
        currentCard={currentCard}
        schedulingOptions={schedulingOptions}
        cardsRemaining={cardsRemaining}
        totalCards={totalCards ?? cardsRemaining}
        onRate={reviewCard}
      />
    </PageContainer>
  )
}
