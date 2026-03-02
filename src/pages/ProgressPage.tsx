import { Link } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProgress } from '@/hooks/useProgress'
import { useTranslation } from '@/lib/i18n'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsChart } from '@/components/progress/StatsChart'
import { StreakCounter } from '@/components/progress/StreakCounter'
import { Skeleton } from '@/components/ui/skeleton'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ProgressPage() {
  const { user } = useAuth()
  const { stats, isLoading } = useProgress(user)
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PageContainer>
    )
  }

  // Guest state — show login CTA instead of zero stats
  if (!user) {
    return (
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t('progress.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('progress.subtitle')}</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <h2 className="text-lg font-semibold">{t('guest.studyTitle')}</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t('guest.progressDesc')}
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
                to="/signup"
                className={cn(buttonVariants({ variant: 'outline', size: 'default' }), 'gap-1.5')}
              >
                <UserPlus className="h-4 w-4" />
                {t('guest.signUp')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('progress.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('progress.subtitle')}</p>
      </div>

      <div className="space-y-4">
        {/* Streak + accuracy */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <StreakCounter streakDays={stats.streakDays} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stats.accuracyPercent}%</p>
              <p className="text-xs text-muted-foreground">{t('progress.accuracy30d')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Card state breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('progress.cardsByState')}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {t('progress.total', { count: stats.total })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.total > 0 ? (
              <StatsChart
                newCards={stats.newCards}
                learning={stats.learning}
                review={stats.review}
                relearning={stats.relearning}
                total={stats.total}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('progress.startStudying')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Summary numbers */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: t('progress.new'), value: stats.newCards },
                { label: t('progress.learning'), value: stats.learning },
                { label: t('progress.review'), value: stats.review },
                { label: t('progress.relearning'), value: stats.relearning },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
