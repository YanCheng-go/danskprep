import { useAuth } from '@/hooks/useAuth'
import { useProgress } from '@/hooks/useProgress'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsChart } from '@/components/progress/StatsChart'
import { StreakCounter } from '@/components/progress/StreakCounter'
import { Skeleton } from '@/components/ui/skeleton'

export function ProgressPage() {
  const { user } = useAuth()
  const { stats, isLoading } = useProgress(user)

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

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-muted-foreground text-sm mt-1">Your learning statistics</p>
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
              <p className="text-xs text-muted-foreground">Accuracy (30d)</p>
            </CardContent>
          </Card>
        </div>

        {/* Card state breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Cards by state
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({stats.total} total)
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
                Start studying to see your progress here.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Summary numbers */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'New', value: stats.newCards },
                { label: 'Learning', value: stats.learning },
                { label: 'Review', value: stats.review },
                { label: 'Relearning', value: stats.relearning },
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
