import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Dumbbell, PenLine, BookOpen, Coffee } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { SupportDialog } from '@/components/layout/SupportDialog'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { SETTINGS_KEYS } from '@/lib/constants'

const FEATURES = [
  { icon: Brain, titleKey: 'welcome.studyTitle', descKey: 'welcome.studyDesc' },
  { icon: Dumbbell, titleKey: 'welcome.quizTitle', descKey: 'welcome.quizDesc' },
  { icon: PenLine, titleKey: 'welcome.writingTitle', descKey: 'welcome.writingDesc' },
  { icon: BookOpen, titleKey: 'welcome.grammarTitle', descKey: 'welcome.grammarDesc' },
] as const

export function WelcomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [supportOpen, setSupportOpen] = useState(false)

  function handleGetStarted() {
    localStorage.setItem(SETTINGS_KEYS.WELCOME_SEEN, 'true')
    navigate('/')
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('welcome.title')}
          </h1>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg">
            {t('welcome.subtitle')}
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="rounded-lg border bg-card p-5 flex gap-4 items-start"
            >
              <div className="shrink-0 rounded-md bg-primary/10 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">{t(titleKey)}</h2>
                <p className="text-muted-foreground text-sm mt-1">{t(descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Support note */}
        <div className="rounded-lg border border-pink-200 dark:border-pink-800/40 bg-pink-50 dark:bg-pink-950/20 p-4 mb-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {t('welcome.supportNote')}
          </p>
          <button
            onClick={() => setSupportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#5a78ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a68ef] transition-colors"
          >
            <Coffee className="h-4 w-4" />
            {t('support.dialogTitle')}
          </button>
        </div>

        {/* Get Started */}
        <div className="text-center">
          <Button size="lg" onClick={handleGetStarted}>
            {t('welcome.getStarted')}
          </Button>
        </div>
      </div>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </PageContainer>
  )
}
