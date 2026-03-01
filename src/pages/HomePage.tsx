import { useAuth } from '@/hooks/useAuth'
import { useProgress } from '@/hooks/useProgress'
import { PageContainer } from '@/components/layout/PageContainer'
import { Dashboard } from '@/components/progress/Dashboard'

export function HomePage() {
  const { user } = useAuth()
  const { stats, isLoading } = useProgress(user)

  const dueCount = stats.learning + stats.review + stats.relearning

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Good day! 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.email ? `Signed in as ${user.email}` : 'Welcome to DanskPrep'}
        </p>
      </div>
      <Dashboard
        dueCount={dueCount}
        streakDays={stats.streakDays}
        newCards={stats.newCards}
        learning={stats.learning}
        review={stats.review}
        relearning={stats.relearning}
        total={stats.total}
        accuracyPercent={stats.accuracyPercent}
        isLoading={isLoading}
      />
    </PageContainer>
  )
}
