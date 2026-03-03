import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, Gamepad2, Trophy, LogIn, UserPlus } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { useTranslation } from '@/lib/i18n'
import { SETTINGS_KEYS } from '@/lib/constants'

interface WelcomeTopBarProps {
  locale: Locale
  onLocaleToggle: () => void
  onToggleBubbles: () => void
  bubblesEnabled?: boolean
  bubbleScore?: number
  onOpenGamePanel?: () => void
}

export function WelcomeTopBar({ locale, onLocaleToggle, onToggleBubbles, bubblesEnabled = true, bubbleScore = 0, onOpenGamePanel }: WelcomeTopBarProps) {
  const { t } = useTranslation()
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  )

  function handleThemeToggle() {
    const nowDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem(SETTINGS_KEYS.DARK_MODE, String(nowDark))
    setIsDark(nowDark)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 sm:px-6 py-4 backdrop-blur-xl bg-background/80 border-b border-foreground/[0.08]">
      <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
        <span className="text-xl">{'\u{1F1E9}\u{1F1F0}'}</span>
        <span className="hidden sm:inline">DanskPrep</span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Game toggle */}
        <button
          onClick={onToggleBubbles}
          className={`relative bg-foreground/[0.04] border border-foreground/[0.08] rounded-md min-h-11 min-w-11 flex items-center justify-center hover:bg-foreground/[0.07] hover:border-foreground/[0.15] transition-all ${bubblesEnabled ? 'text-blue-500' : 'text-muted-foreground/40'}`}
          title={bubblesEnabled ? t('bubble.game.turnOff') : t('bubble.game.turnOn')}
          aria-label={t('bubble.game.toggleLabel')}
        >
          <Gamepad2 className="h-4 w-4" />
          {!bubblesEnabled && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="block w-5 h-px bg-muted-foreground/60 rotate-45" />
            </span>
          )}
        </button>
        {/* Trophy — opens rankings, only when game is on */}
        {bubblesEnabled && (
          <button
            onClick={onOpenGamePanel}
            className="inline-flex items-center gap-0.5 bg-foreground/[0.04] border border-foreground/[0.08] rounded-md min-h-11 min-w-11 justify-center px-1.5 py-1 text-xs font-bold text-yellow-600 dark:text-yellow-400 hover:bg-foreground/[0.07] hover:border-foreground/[0.15] transition-all"
            title={t('bubble.game.tooltip')}
            aria-label={t('bubble.game.tooltip')}
          >
            <Trophy className="h-4 w-4 text-yellow-500" />
            {bubbleScore > 0 && <span>{bubbleScore}</span>}
          </button>
        )}
        <button
          onClick={handleThemeToggle}
          className="text-muted-foreground bg-foreground/[0.04] border border-foreground/[0.08] rounded-md min-h-11 min-w-11 flex items-center justify-center hover:bg-foreground/[0.07] hover:border-foreground/[0.15] transition-all"
          title={isDark ? t('header.darkMode.light') : t('header.darkMode.dark')}
          aria-label={isDark ? t('header.darkMode.light') : t('header.darkMode.dark')}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={onLocaleToggle}
          className="text-muted-foreground bg-foreground/[0.04] border border-foreground/[0.08] rounded-md min-h-11 min-w-11 flex items-center justify-center hover:bg-foreground/[0.07] hover:border-foreground/[0.15] transition-all"
          title={locale === 'en' ? 'Skift til dansk' : 'Switch to English'}
          aria-label={locale === 'en' ? 'Skift til dansk' : 'Switch to English'}
        >
          <span className="text-[15px]">{locale === 'en' ? '\u{1F1E9}\u{1F1F0}' : '\u{1F1EC}\u{1F1E7}'}</span>
        </button>

        {/* Separator */}
        <span className="w-px h-5 bg-foreground/[0.1] hidden sm:block" />

        {/* Sign in / Sign up */}
        <Link
          to="/login"
          className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
        >
          <LogIn className="h-3.5 w-3.5" />
          {t('nav.signIn')}
        </Link>
        <Link
          to="/signup"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md px-3 py-1.5 min-h-11 transition-colors"
        >
          <UserPlus className="h-3.5 w-3.5 hidden sm:block" />
          {t('nav.signUp')}
        </Link>
      </div>
    </nav>
  )
}
