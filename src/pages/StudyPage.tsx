import { Link } from 'react-router-dom'
import { LogIn, List } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudy } from '@/hooks/useStudy'
import { PageContainer } from '@/components/layout/PageContainer'
import { ReviewQueue } from '@/components/study/ReviewQueue'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

export function StudyPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { currentCard, schedulingOptions, cardsRemaining, totalCards, isLoading, error, reviewCard } =
    useStudy(user, 'daily')

  // Guest state — show login prompt instead of misleading empty state
  if (!user) {
    return (
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t('study.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('study.subtitle')}</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <h2 className="text-lg font-semibold">{t('guest.studyTitle')}</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t('guest.studyDesc')}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/login"
                className={cn(buttonVariants({ size: 'default' }), 'gap-1.5')}
              >
                <LogIn className="h-4 w-4" />
                {t('guest.signIn')}
              </Link>
              <Link
                to="/quiz"
                className={cn(buttonVariants({ variant: 'outline', size: 'default' }), 'gap-1.5')}
              >
                <List className="h-4 w-4" />
                {t('guest.tryQuiz')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
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
            {t('common.retry')}
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
          <h2 className="text-xl font-semibold">{t('study.allDone')}</h2>
          <p className="text-muted-foreground text-sm">
            {t('study.noDue')}
          </p>
          <Link
            to="/quiz"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            {t('study.quizInstead')}
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('study.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('study.subtitle')}</p>
      </div>
      <ReviewQueue
        currentCard={currentCard}
        schedulingOptions={schedulingOptions}
        cardsRemaining={cardsRemaining}
        totalCards={totalCards}
        onRate={reviewCard}
      />
    </PageContainer>
  )
}
