import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  BookOpen,
  Brain,
  ClipboardCheck,
  Dumbbell,
  Github,
  Home,
  List,
  LogIn,
  Mic,
  MessageSquare,
  Newspaper,
  PenLine,
  PlusCircle,
  Radio,
  Settings,
  Sparkles,
  BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog'
import { AddExerciseDialog } from '@/components/exercise/AddExerciseDialog'
import { useTranslation } from '@/lib/i18n'
import { APP_VERSION } from '@/lib/constants'
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
}

export function Sidebar({ user, onClose }: SidebarProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const [signInPromptOpen, setSignInPromptOpen] = useState(false)
  const { t } = useTranslation()

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
