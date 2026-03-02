import { useEffect, useState } from 'react'
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
  const [mode, setMode] = useState<'daily' | 'all'>('daily')
  const [totalCards, setTotalCards] = useState<number | null>(null)
  const { currentCard, schedulingOptions, cardsRemaining, isLoading, error, reviewCard } =
    useStudy(user, mode)

  // Reset total when mode changes
  useEffect(() => {
    setTotalCards(null)
  }, [mode])

  // Track total on first load of each mode
  if (totalCards === null && cardsRemaining > 0) {
    setTotalCards(cardsRemaining)
  }

  const modeToggle = (
    <div className="flex rounded-lg border overflow-hidden mb-6">
      <button
        className={cn(
          'flex-1 py-2 text-sm font-medium transition-colors',
          mode === 'daily' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
        )}
        onClick={() => setMode('daily')}
      >
        Daily Review
      </button>
      <button
        className={cn(
          'flex-1 py-2 text-sm font-medium transition-colors border-l',
          mode === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
        )}
        onClick={() => setMode('all')}
      >
        All Questions
      </button>
    </div>
  )

  if (isLoading) {
    return (
      <PageContainer>
        {modeToggle}
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
        {modeToggle}
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
    const doneMessage = mode === 'daily'
      ? 'No cards due. Come back tomorrow to keep your streak going.'
      : 'You\'ve reviewed all questions. Switch to Daily Review to see your FSRS schedule.'

    return (
      <PageContainer>
        {modeToggle}
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-semibold">
            {mode === 'daily' ? 'All done for today!' : 'All questions reviewed!'}
          </h2>
          <p className="text-muted-foreground text-sm">{doneMessage}</p>
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
      {modeToggle}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Study</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {mode === 'daily' ? 'Daily review' : 'All questions'}
        </p>
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
