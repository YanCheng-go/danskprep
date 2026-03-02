import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Coffee } from 'lucide-react'
import { Agentation } from 'agentation'
import { SupportDialog } from '@/components/layout/SupportDialog'
import { FloatingWords } from '@/components/welcome/FloatingWords'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { SETTINGS_KEYS } from '@/lib/constants'
import changelogData from '@/data/seed/changelog.json'

const latestStats = (changelogData as { stats: Record<string, number> }[])[0].stats

const STEPS = [
  { emoji: '\u{1F4DD}', key: 'welcome.step1' },
  { emoji: '\u{1F9E0}', key: 'welcome.step2' },
  { emoji: '\u270D\uFE0F', key: 'welcome.step3' },
  { emoji: '\u{1F4CA}', key: 'welcome.step4' },
] as const

export function WelcomePage() {
  const { locale, setLocale, t } = useTranslation()
  const navigate = useNavigate()
  const [supportOpen, setSupportOpen] = useState(false)

  function handleStart() {
    localStorage.setItem(SETTINGS_KEYS.WELCOME_SEEN, 'true')
    navigate('/')
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <FloatingWords />
      <div className="relative z-20 mx-auto max-w-2xl px-4 pt-4 pb-8 sm:pt-6 sm:pb-12 pointer-events-none [&_button]:pointer-events-auto [&_a]:pointer-events-auto">
        {/* Language toggle */}
        <div className="mb-6">
          <button
            onClick={() => setLocale(locale === 'en' ? 'da' : 'en')}
            className="rounded-md border px-2 py-1 text-sm hover:bg-accent transition-colors"
            title={locale === 'en' ? 'Skift til dansk' : 'Switch to English'}
          >
            {locale === 'en' ? '\u{1F1E9}\u{1F1F0} Dansk' : '\u{1F1EC}\u{1F1E7} English'}
          </button>
        </div>

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">{'\u{1F1E9}\u{1F1F0}'}</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('welcome.title')}
          </h1>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg">
            {t('welcome.subtitle')}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('welcome.socialProof')
              .replace('{exercises}', String(latestStats.exercises))
              .replace('{words}', String(latestStats.words))}
          </p>
        </div>

        {/* Single primary CTA */}
        <div className="flex flex-col items-center gap-3 mb-12">
          <Button
            size="lg"
            onClick={handleStart}
            className="w-full sm:w-auto sm:min-w-[240px] text-base"
          >
            {t('welcome.startPracticing')}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t('welcome.orSignUp').split('{link}')[0]}
            <Link to="/signup" className="text-primary underline underline-offset-4">
              {t('guest.signUp').toLowerCase()}
            </Link>
            {t('welcome.orSignUp').split('{link}')[1]}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('welcome.haveAccount').split('{link}')[0]}
            <Link to="/login" className="text-primary underline underline-offset-4">
              {t('guest.signIn')}
            </Link>
            {t('welcome.haveAccount').split('{link}')[1]}
          </p>
        </div>

        {/* How it works — 3-step strip */}
        <div className="mb-10">
          <h2 className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground mb-6">
            {t('welcome.howItWorks')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map(({ emoji, key }) => (
              <div
                key={key}
                className="rounded-lg border bg-card p-4 text-center"
              >
                <div className="text-2xl mb-2">{emoji}</div>
                <p className="text-sm text-muted-foreground">{t(key)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support note */}
        <div className="rounded-lg border border-pink-200 dark:border-pink-800/40 bg-pink-50 dark:bg-pink-950/20 p-4 text-center">
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
      </div>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
      {import.meta.env.DEV && <Agentation />}
    </div>
  )
}
