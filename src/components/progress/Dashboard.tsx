import { Link } from 'react-router-dom'
import { Brain, Dumbbell, List, LogIn, UserPlus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StreakCounter } from './StreakCounter'
import { StatsChart } from './StatsChart'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

interface DashboardProps {
  dueCount: number
  streakDays: number
  newCards: number
  learning: number
  review: number
  relearning: number
  total: number
  accuracyPercent: number
  isLoading: boolean
  isGuest?: boolean
}

export function Dashboard({
  dueCount,
  streakDays,
  newCards,
  learning,
  review,
  relearning,
  total,
  accuracyPercent,
  isLoading,
  isGuest,
}: DashboardProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Streak + due cards (only for authenticated users) */}
      {!isGuest && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <StreakCounter streakDays={streakDays} />
              <div className="text-right">
                <p className="text-3xl font-bold">{dueCount}</p>
                <p className="text-xs text-muted-foreground">{t('progress.cardsDue')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guest sign-in CTA */}
      {isGuest && (
        <Card>
          <CardContent className="pt-6 pb-6">
            <p className="text-sm text-muted-foreground mb-3">
              {t('guest.dashboardDesc')}
            </p>
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
              >
                <LogIn className="h-4 w-4" />
                {t('guest.signIn')}
              </Link>
              <Link
                to="/signup"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
              >
                <UserPlus className="h-4 w-4" />
                {t('guest.signUp')}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick-start buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          to="/study"
          className={cn(buttonVariants({ size: 'lg' }), 'h-16 flex-col gap-1')}
        >
          <Brain className="h-5 w-5" />
          <span className="text-sm">{t('progress.studyNow')}</span>
        </Link>
        <Link
          to="/quiz"
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-16 flex-col gap-1')}
        >
          <List className="h-5 w-5" />
          <span className="text-sm">{t('progress.quickQuiz')}</span>
        </Link>
        <Link
          to="/drill"
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-16 flex-col gap-1')}
        >
          <Dumbbell className="h-5 w-5" />
          <span className="text-sm">{t('progress.drill')}</span>
        </Link>
      </div>

      {/* Stats (only for authenticated users with data) */}
      {!isGuest && total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex justify-between">
              <span>{t('progress.cardsByState')}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {accuracyPercent}% {t('progress.accuracy')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatsChart
              newCards={newCards}
              learning={learning}
              review={review}
              relearning={relearning}
              total={total}
            />
          </CardContent>
        </Card>
      )}

      {!isGuest && total === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              {t('progress.empty')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
