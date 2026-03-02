import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ClipboardCheck,
  Brain,
  PenLine,
  Speech,
  BookOpen,
  Library,
  Coffee,
  Check,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Agentation } from 'agentation'
import { SupportDialog } from '@/components/layout/SupportDialog'
import { WelcomeTopBar } from '@/components/welcome/WelcomeTopBar'
import { FloatingWords } from '@/components/welcome/FloatingWords'
import { GamePanel } from '@/components/welcome/GamePanel'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { useBubbleGame } from '@/hooks/useBubbleGame'
import { SETTINGS_KEYS } from '@/lib/constants'
import type { TranslationKeys } from '@/data/translations/en'
import changelogData from '@/data/seed/changelog.json'

const latestStats = (changelogData as { stats: Record<string, number> }[])[0].stats

// ---- Data arrays ----

interface Feature {
  icon: LucideIcon
  titleKey: TranslationKeys
  descKey: TranslationKeys
  tagKey?: TranslationKeys
  featured: boolean
  iconBg: string
  iconColor: string
}

const FEATURES: Feature[] = [
  {
    icon: ClipboardCheck,
    titleKey: 'welcome.feature.quiz.title',
    descKey: 'welcome.feature.quiz.desc',
    tagKey: 'welcome.feature.quiz.tag',
    featured: true,
    iconBg: 'bg-blue-500/10 border-blue-500/15',
    iconColor: 'text-blue-400',
  },
  {
    icon: Brain,
    titleKey: 'welcome.feature.srs.title',
    descKey: 'welcome.feature.srs.desc',
    featured: false,
    iconBg: 'bg-violet-500/10 border-violet-500/15',
    iconColor: 'text-violet-400',
  },
  {
    icon: PenLine,
    titleKey: 'welcome.feature.writing.title',
    descKey: 'welcome.feature.writing.desc',
    featured: false,
    iconBg: 'bg-pink-500/10 border-pink-500/15',
    iconColor: 'text-pink-400',
  },
  {
    icon: Speech,
    titleKey: 'welcome.feature.speaking.title',
    descKey: 'welcome.feature.speaking.desc',
    tagKey: 'welcome.feature.speaking.tag',
    featured: true,
    iconBg: 'bg-green-500/10 border-green-500/15',
    iconColor: 'text-green-400',
  },
  {
    icon: BookOpen,
    titleKey: 'welcome.feature.grammar.title',
    descKey: 'welcome.feature.grammar.desc',
    featured: false,
    iconBg: 'bg-orange-500/10 border-orange-500/15',
    iconColor: 'text-orange-400',
  },
  {
    icon: Library,
    titleKey: 'welcome.feature.dictionary.title',
    descKey: 'welcome.feature.dictionary.desc',
    featured: false,
    iconBg: 'bg-cyan-500/10 border-cyan-500/15',
    iconColor: 'text-cyan-400',
  },
]

const STEPS = [
  { number: 1, titleKey: 'welcome.step.practice.title', descKey: 'welcome.step.practice.desc' },
  { number: 2, titleKey: 'welcome.step.review.title', descKey: 'welcome.step.review.desc' },
  { number: 3, titleKey: 'welcome.step.track.title', descKey: 'welcome.step.track.desc' },
]

const BENEFITS = [
  { titleKey: 'welcome.benefit.srs.title', descKey: 'welcome.benefit.srs.desc' },
  { titleKey: 'welcome.benefit.streak.title', descKey: 'welcome.benefit.streak.desc' },
  { titleKey: 'welcome.benefit.sync.title', descKey: 'welcome.benefit.sync.desc' },
  { titleKey: 'welcome.benefit.exercises.title', descKey: 'welcome.benefit.exercises.desc' },
]

export function WelcomePage() {
  const { locale, setLocale, t } = useTranslation()
  const navigate = useNavigate()
  const [supportOpen, setSupportOpen] = useState(false)
  const {
    bubbleScore, setBubbleScore,
    gamePanelOpen, setGamePanelOpen,
    bubblesEnabled, toggleBubbles,
  } = useBubbleGame({ initialEnabled: true })

  function handleStart() {
    localStorage.setItem(SETTINGS_KEYS.WELCOME_SEEN, 'true')
    navigate('/home')
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Fixed top bar — z-50 */}
      <WelcomeTopBar
        locale={locale}
        onLocaleToggle={() => setLocale(locale === 'en' ? 'da' : 'en')}
        onToggleBubbles={toggleBubbles}
        bubblesEnabled={bubblesEnabled}
        bubbleScore={bubbleScore}
        onOpenGamePanel={() => setGamePanelOpen(o => !o)}
      />

      {/* Floating word bubbles — z-10 background */}
      {bubblesEnabled && (
        <FloatingWords score={bubbleScore} onScoreChange={setBubbleScore} />
      )}

      {/* Content + Game panel flex row */}
      <div className="flex">

      {/* Page content — z-20 */}
      <div className="relative z-20 flex-1 min-w-0 pointer-events-none [&_button]:pointer-events-auto [&_a]:pointer-events-auto [&_input]:pointer-events-auto [&_select]:pointer-events-auto [&_textarea]:pointer-events-auto">

        {/* ============ HERO ============ */}
        <section className="relative min-h-screen flex flex-col items-center text-center px-6 pt-20 pb-12">
          {/* Glow effect */}
          <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(59,130,246,0.12)_0%,rgba(59,130,246,0.04)_40%,transparent_70%)] pointer-events-none" />

          {/* Top spacer — pushes main content to vertical center */}
          <div className="flex-1" />

          {/* Eyebrow badge */}
          <div className="relative inline-flex items-center gap-2 text-[13px] font-medium text-primary uppercase tracking-wider mb-6 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot" />
            {t('welcome.eyebrow', {
              exercises: latestStats.exercises,
              words: latestStats.words,
            })}
          </div>

          {/* Headline */}
          <h1 className="relative text-[clamp(36px,6vw,64px)] font-bold tracking-tighter leading-[1.1] mb-5 max-w-[700px]">
            {t('welcome.headline.line1')}
            <br />
            <span className="gradient-text">{t('welcome.headline.line2')}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[clamp(16px,2vw,19px)] text-muted-foreground max-w-[540px] mb-9 leading-relaxed">
            {t('welcome.subtitle')}
          </p>

          {/* CTA group */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <Button
              size="lg"
              onClick={handleStart}
              className="min-w-[260px] text-base font-semibold py-3.5 px-10 glow-primary"
            >
              {t('welcome.startPracticing')}
            </Button>
            <Link
              to="/signup"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'min-w-[260px] text-base text-muted-foreground border-foreground/[0.08] bg-transparent hover:bg-foreground/[0.04] hover:border-foreground/[0.15] hover:text-foreground'
              )}
            >
              {t('welcome.createAccount')}
            </Link>
            <div className="text-sm text-muted-foreground/70">
              <Link to="/login" className="text-muted-foreground underline underline-offset-4 decoration-foreground/20 hover:decoration-foreground/50 hover:text-foreground transition-colors">
                {t('welcome.signInLink')}
              </Link>
            </div>
          </div>

          {/* Social proof micro-strip */}
          <div className="flex items-center gap-5 text-[13px] text-muted-foreground/70 flex-wrap justify-center">
            <span className="flex items-center gap-1.5">
              <strong className="text-muted-foreground font-semibold">{t('welcome.socialProof.module')}</strong>
            </span>
            <span className="w-px h-3.5 bg-foreground/[0.08] hidden md:block" />
            <span className="flex items-center gap-1.5">
              {t('welcome.socialProof.coming')}
            </span>
            <span className="w-px h-3.5 bg-foreground/[0.08] hidden md:block" />
            <a
              href="https://github.com/YanCheng-go/danskprep"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 underline underline-offset-4 decoration-foreground/20 hover:decoration-foreground/50 hover:text-foreground transition-colors"
            >
              {t('welcome.socialProof.openSource')}
            </a>
          </div>

          {/* Bottom spacer + support / coffee */}
          <div className="flex-1 flex flex-col items-center justify-end gap-3 pt-8">
            <p className="text-sm text-muted-foreground/50">
              {t('welcome.support.text')}
            </p>
            <button
              onClick={() => setSupportOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-pink-400 bg-transparent border border-pink-400/30 hover:border-pink-400/60 rounded-lg px-5 py-2.5 transition-colors"
            >
              <Coffee className="h-4 w-4" />
              {t('support.dialogTitle')}
            </button>
          </div>
        </section>

        {/* ============ STATS BAR ============ */}
        <section className="py-12 border-t border-b border-foreground/[0.08]">
          <div className="max-w-[960px] mx-auto px-6 flex justify-center gap-12 flex-wrap">
            {[
              { value: latestStats.exercises, label: t('welcome.stats.exercises') },
              { value: latestStats.words, label: t('welcome.stats.words') },
              { value: latestStats.grammar_topics, label: t('welcome.stats.grammarTopics') },
              { value: 7, label: t('welcome.stats.practiceModes') },
            ].map((stat) => (
              <div key={stat.label} className="text-center min-w-[120px]">
                <div className="text-[32px] md:text-[32px] font-bold tracking-tight text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-[13px] text-muted-foreground/70 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ BENTO FEATURE GRID ============ */}
        <section className="py-24 px-6">
          <div className="text-center mb-14">
            <div className="text-[13px] font-medium text-primary uppercase tracking-widest mb-4">
              {t('welcome.features.overline')}
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tight mb-4">
              {t('welcome.features.title')}
            </h2>
            <p className="text-[17px] text-muted-foreground max-w-[520px] mx-auto">
              {t('welcome.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[900px] mx-auto">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.titleKey}
                  className={cn(
                    'relative overflow-hidden rounded-xl border border-foreground/[0.08] bg-foreground/[0.04] p-7 transition-all duration-300 hover:bg-foreground/[0.07] hover:border-foreground/[0.15] hover:-translate-y-0.5',
                    feature.featured && 'md:col-span-2'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-[10px] flex items-center justify-center mb-4 border',
                      feature.iconBg
                    )}
                  >
                    <Icon className={cn('h-5 w-5', feature.iconColor)} />
                  </div>
                  <h3 className="text-base font-semibold mb-2 tracking-tight">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(feature.descKey, {
                      exercises: latestStats.exercises,
                      topics: latestStats.grammar_topics,
                    })}
                  </p>
                  {feature.tagKey && (
                    <span className="inline-block text-[11px] font-medium text-muted-foreground/70 bg-foreground/[0.05] border border-foreground/[0.08] rounded px-2 py-0.5 mt-3">
                      {t(feature.tagKey)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="py-24 px-6 border-t border-foreground/[0.08]">
          <div className="text-center mb-14">
            <div className="text-[13px] font-medium text-primary uppercase tracking-widest mb-4">
              {t('welcome.howItWorks.overline')}
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tight mb-4">
              {t('welcome.howItWorks.title')}
            </h2>
            <p className="text-[17px] text-muted-foreground max-w-[520px] mx-auto">
              {t('welcome.howItWorks.subtitle')}
            </p>
          </div>

          <div className="relative flex flex-col md:flex-row gap-8 md:gap-8 max-w-[800px] mx-auto">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-7 left-[80px] right-[80px] h-px bg-gradient-to-r from-foreground/[0.08] via-primary/30 to-foreground/[0.08]" />

            {STEPS.map((step) => (
              <div key={step.number} className="flex-1 text-center group">
                <div className="relative z-[1] w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5 bg-background border-2 border-foreground/[0.08] text-muted-foreground group-hover:border-primary group-hover:text-primary group-hover:shadow-[0_0_24px_rgba(59,130,246,0.25)] transition-all">
                  {step.number}
                </div>
                <h3 className="text-[15px] font-semibold mb-2">
                  {t(step.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground/70 leading-relaxed">
                  {t(step.descKey)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ SIGN-IN BENEFITS ============ */}
        <section className="py-24 px-6 border-t border-foreground/[0.08]">
          <div className="text-center mb-14">
            <div className="text-[13px] font-medium text-primary uppercase tracking-widest mb-4">
              {t('welcome.benefits.overline')}
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tight mb-4">
              {t('welcome.benefits.title')}
            </h2>
            <p className="text-[17px] text-muted-foreground max-w-[520px] mx-auto">
              {t('welcome.benefits.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[700px] mx-auto">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.titleKey}
                className="flex items-start gap-3.5 p-4 pr-5 rounded-lg bg-foreground/[0.04] border border-foreground/[0.08]"
              >
                <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground font-semibold">{t(benefit.titleKey)}</strong>{' '}
                  {t(benefit.descKey)}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/signup"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'text-muted-foreground border-foreground/[0.08] bg-transparent hover:bg-foreground/[0.04] hover:border-foreground/[0.15] hover:text-foreground'
              )}
            >
              {t('welcome.createAccount')}
            </Link>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="relative py-24 px-6 text-center border-t border-foreground/[0.08]">
          {/* Bottom glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none" />

          <h2 className="relative text-[clamp(28px,4vw,40px)] font-bold tracking-tight mb-4">
            {t('welcome.finalCta.title')}
          </h2>
          <p className="relative text-[17px] text-muted-foreground mb-8">
            {t('welcome.finalCta.subtitle')}
          </p>
          <Button
            size="lg"
            onClick={handleStart}
            className="relative min-w-[260px] text-base font-semibold py-3.5 px-10 glow-primary"
          >
            {t('welcome.startPracticing')}
          </Button>
        </section>
      </div>

      {/* Game rankings panel — inline, squeezes content */}
      <GamePanel open={gamePanelOpen} onClose={() => setGamePanelOpen(false)} currentScore={bubbleScore} onScoreReset={() => setBubbleScore(0)} onScoreLoad={(score) => setBubbleScore(score)} />
      </div>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
      {import.meta.env.DEV && <Agentation />}
    </div>
  )
}
