import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProgress } from '@/hooks/useProgress'
import { PageContainer } from '@/components/layout/PageContainer'
import { Dashboard } from '@/components/progress/Dashboard'
import { WhatsNew } from '@/components/progress/WhatsNew'
import { useTranslation } from '@/lib/i18n'
import { SETTINGS_KEYS } from '@/lib/constants'

export function HomePage() {
  const { user } = useAuth()
  const { stats, isLoading } = useProgress(user)
  const { t } = useTranslation()

  // Redirect first-time visitors to the welcome page
  if (localStorage.getItem(SETTINGS_KEYS.WELCOME_SEEN) !== 'true') {
    return <Navigate to="/welcome" replace />
  }

  const dueCount = stats.learning + stats.review + stats.relearning

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('home.greeting')} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.email ? t('home.signedIn', { email: user.email }) : t('home.welcome')}
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
        isGuest={!user}
      />
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">{t('home.latestUpdates')}</h2>
        <WhatsNew />
      </div>
    </PageContainer>
  )
}
