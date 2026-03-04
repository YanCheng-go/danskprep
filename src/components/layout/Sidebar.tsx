import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  BookOpen,
  Brain,
  ClipboardCheck,
  Coffee,
  Dumbbell,
  Gamepad2,
  Github,
  Home,
  List,
  LogIn,
  LogOut,
  Mic,
  MessageSquare,
  Moon,
  Newspaper,
  PenLine,
  PlusCircle,
  Radio,
  Settings,
  Sparkles,
  Sun,
  Trophy,
  BarChart2,
} from 'lucide-react'
import { track } from '@vercel/analytics'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog'
import { AddExerciseDialog } from '@/components/exercise/AddExerciseDialog'
import { SupportDialog } from './SupportDialog'
import { useTranslation } from '@/lib/i18n'
import { APP_VERSION, SETTINGS_KEYS } from '@/lib/constants'
import type { User } from '@supabase/supabase-js'

interface NavItem {
  to: string
  labelKey: string
  icon: React.ReactNode
}

const linkClass = cn(
  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-11',
  'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
)

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
      {children}
    </p>
  )
}

interface SidebarProps {
  user?: User | null
  onClose?: () => void
  bubblesEnabled?: boolean
  onToggleBubbles?: () => void
  bubbleScore?: number
  onOpenGamePanel?: () => void
  onSignOut?: () => void
}

export function Sidebar({ user, onClose, bubblesEnabled = false, onToggleBubbles, bubbleScore = 0, onOpenGamePanel, onSignOut }: SidebarProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const [signInPromptOpen, setSignInPromptOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const { locale, setLocale, t } = useTranslation()
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  )

  function handleThemeToggle() {
    const nowDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem(SETTINGS_KEYS.DARK_MODE, String(nowDark))
    setIsDark(nowDark)
  }

  const practiceItems: NavItem[] = [
    { to: '/study', labelKey: 'nav.study', icon: <Brain className="h-5 w-5" /> },
    { to: '/quiz', labelKey: 'nav.quiz', icon: <List className="h-5 w-5" /> },
    { to: '/drill', labelKey: 'nav.drill', icon: <Dumbbell className="h-5 w-5" /> },
    { to: '/writing', labelKey: 'nav.writing', icon: <PenLine className="h-5 w-5" /> },
    { to: '/speaking', labelKey: 'nav.speaking', icon: <Mic className="h-5 w-5" /> },
  ]

  const referenceItems: NavItem[] = [
    { to: '/grammar', labelKey: 'nav.grammar', icon: <BookOpen className="h-5 w-5" /> },
    { to: '/vocabulary', labelKey: 'nav.vocabulary', icon: <List className="h-5 w-5" /> },
    { to: '/podcast', labelKey: 'nav.podcast', icon: <Radio className="h-5 w-5" /> },
    { to: '/newsletter', labelKey: 'nav.newsletter', icon: <Newspaper className="h-5 w-5" /> },
    { to: '/modultest', labelKey: 'nav.modultest', icon: <ClipboardCheck className="h-5 w-5" /> },
  ]

  const appItems: NavItem[] = [
    { to: '/progress', labelKey: 'nav.progress', icon: <BarChart2 className="h-5 w-5" /> },
    { to: '/updates', labelKey: 'nav.updates', icon: <Sparkles className="h-5 w-5" /> },
    { to: '/settings', labelKey: 'nav.settings', icon: <Settings className="h-5 w-5" /> },
  ]

  function renderNavItems(items: NavItem[]) {
    return items.map(item => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/'}
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-11',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )
        }
      >
        {item.icon}
        {t(item.labelKey)}
      </NavLink>
    ))
  }

  return (
    <nav className="flex h-full flex-col gap-0.5 p-4">
      {/* Home */}
      <NavLink
        to="/home"
        end
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-11',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )
        }
      >
        <Home className="h-5 w-5" />
        {t('nav.home')}
      </NavLink>

      {/* Quick Actions — mobile only */}
      <div className="md:hidden">
        <SectionLabel>{t('nav.quickActions')}</SectionLabel>

        {/* Dark mode toggle */}
        <button onClick={handleThemeToggle} className={linkClass}>
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {isDark ? t('header.darkMode.light') : t('header.darkMode.dark')}
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === 'en' ? 'da' : 'en')}
          className={linkClass}
        >
          <span className="h-5 w-5 flex items-center justify-center text-base">
            {locale === 'en' ? '\u{1F1E9}\u{1F1F0}' : '\u{1F1EC}\u{1F1E7}'}
          </span>
          {locale === 'en' ? 'Skift til dansk' : 'Switch to English'}
        </button>

        {/* Game toggle */}
        <button onClick={onToggleBubbles} className={linkClass}>
          <Gamepad2 className="h-5 w-5" />
          {bubblesEnabled ? t('bubble.game.turnOff') : t('bubble.game.turnOn')}
        </button>

        {/* Game rankings */}
        {bubblesEnabled && (
          <button
            onClick={() => { onOpenGamePanel?.(); onClose?.() }}
            className={linkClass}
          >
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t('bubble.game.tooltip')}
            {bubbleScore > 0 && (
              <span className="ml-auto text-xs font-bold text-yellow-600 dark:text-yellow-400">{bubbleScore}</span>
            )}
          </button>
        )}

        {/* Support */}
        <button
          onClick={() => { setSupportOpen(true); track('support_click') }}
          className={linkClass}
        >
          <Coffee className="h-5 w-5 text-pink-500" />
          {t('support.title')}
        </button>

        {/* Sign out / Sign in */}
        {user ? (
          <button onClick={() => { onSignOut?.(); onClose?.() }} className={linkClass}>
            <LogOut className="h-5 w-5" />
            {t('header.signOut')}
          </button>
        ) : (
          <Link to="/login" onClick={onClose} className={linkClass}>
            <LogIn className="h-5 w-5" />
            {t('header.signIn')}
          </Link>
        )}
      </div>

      {/* Practice section */}
      <SectionLabel>{t('nav.practice')}</SectionLabel>
      {renderNavItems(practiceItems)}

      {/* Reference section */}
      <SectionLabel>{t('nav.reference')}</SectionLabel>
      {renderNavItems(referenceItems)}

      {/* App section */}
      <SectionLabel>{t('nav.app')}</SectionLabel>
      {renderNavItems(appItems)}

      {/* Divider */}
      <div className="my-2 border-t" />

      {/* Add exercise button */}
      <button
        onClick={() => user ? setAddExerciseOpen(true) : setSignInPromptOpen(true)}
        className={linkClass}
      >
        <PlusCircle className="h-5 w-5" />
        {t('nav.addExercise')}
      </button>

      {/* General feedback button */}
      <button
        onClick={() => user ? setFeedbackOpen(true) : setSignInPromptOpen(true)}
        className={linkClass}
      >
        <MessageSquare className="h-5 w-5" />
        {t('nav.feedback')}
      </button>

      <Dialog open={addExerciseOpen} onOpenChange={setAddExerciseOpen}>
        <DialogContent>
          <AddExerciseDialog onClose={() => setAddExerciseOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <FeedbackDialog onClose={() => setFeedbackOpen(false)} />
        </DialogContent>
      </Dialog>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />

      {/* Sign-in prompt for guests */}
      <Dialog open={signInPromptOpen} onOpenChange={setSignInPromptOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('guest.signInRequired')}</DialogTitle>
            <DialogDescription>{t('guest.signInRequiredDesc')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/login"
              onClick={() => setSignInPromptOpen(false)}
              className={cn(buttonVariants({ size: 'default' }), 'gap-1.5')}
            >
              <LogIn className="h-4 w-4" />
              {t('guest.signIn')}
            </Link>
            <Link
              to="/signup"
              onClick={() => setSignInPromptOpen(false)}
              className={cn(buttonVariants({ variant: 'outline', size: 'default' }), 'gap-1.5')}
            >
              {t('guest.signUp')}
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Site footer */}
      <div className="mt-auto border-t pt-3">
        <div className="px-3 space-y-1.5">
          <a
            href="https://github.com/YanCheng-go/danskprep"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
            <span className="text-[10px] text-muted-foreground/50">v{APP_VERSION}</span>
          </a>
          <p className="text-[11px] text-muted-foreground/70 leading-snug">
            {t('footer.builtBy')}{' '}
            <a
              href="mailto:chengyan2017@gmail.com"
              className="underline hover:text-foreground transition-colors"
            >
              Yan Cheng
            </a>
          </p>
        </div>
      </div>
    </nav>
  )
}
