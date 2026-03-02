import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useProgress } from '@/hooks/useProgress'
import { PageContainer } from '@/components/layout/PageContainer'
import { SupportDialog } from '@/components/layout/SupportDialog'
import { Dashboard } from '@/components/progress/Dashboard'
import { WhatsNew } from '@/components/progress/WhatsNew'
import { useTranslation } from '@/lib/i18n'
import { Heart, X } from 'lucide-react'

const MILESTONE_DISMISSED_KEY = 'danskprep_milestone_donate_dismissed'

export function HomePage() {
  const { user } = useAuth()
  const { stats, isLoading } = useProgress(user)
  const { t } = useTranslation()
  const [milestoneDismissed, setMilestoneDismissed] = useState(
    () => localStorage.getItem(MILESTONE_DISMISSED_KEY) === 'true'
  )
  const [supportOpen, setSupportOpen] = useState(false)

  const dueCount = stats.learning + stats.review + stats.relearning
  const showMilestone = !milestoneDismissed && (stats.streakDays >= 7 || stats.total >= 100)

  function dismissMilestone() {
    setMilestoneDismissed(true)
    localStorage.setItem(MILESTONE_DISMISSED_KEY, 'true')
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('home.greeting')} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.email ? t('home.signedIn', { email: user.email }) : t('home.welcome')}
        </p>
      </div>
      <div className="mb-4">
        <WhatsNew />
      </div>
      {showMilestone && (
        <div className="mb-4 rounded-lg border border-pink-200 dark:border-pink-800/40 bg-pink-50 dark:bg-pink-950/20 p-4">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-pink-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t('donate.milestone')}</p>
              <button
                onClick={() => setSupportOpen(true)}
                className="inline-flex items-center gap-1.5 mt-2 rounded-md bg-[#5a78ff] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4a68ef] transition-colors"
              >
                {t('donate.milestoneAction')}
              </button>
            </div>
            <button
              onClick={dismissMilestone}
              className="shrink-0 rounded-sm p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t('updates.dismiss')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
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
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </PageContainer>
  )
}
