import { Link } from 'react-router-dom'
import { Brain, List } from 'lucide-react'
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
      {/* Streak + quick actions */}
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

      {/* Quick-start buttons */}
      <div className="grid grid-cols-2 gap-3">
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
      </div>

      {/* Stats */}
      {total > 0 && (
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

      {total === 0 && (
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
