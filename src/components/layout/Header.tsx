import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, LogIn, LogOut, ChevronDown, Coffee, Search, BookOpen, Gamepad2, Moon, Sun, Trophy } from 'lucide-react'
import { track } from '@vercel/analytics'
import { Button } from '@/components/ui/button'
import { SupportDialog } from './SupportDialog'
import { AVAILABLE_MODULES, DEFAULT_MODULE, SETTINGS_KEYS } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User | null
  menuOpen: boolean
  onToggleMenu: () => void
  onSignOut: () => void
  bubblesEnabled?: boolean
  onToggleBubbles?: () => void
  bubbleScore?: number
  onOpenGamePanel?: () => void
}

export function Header({ user, menuOpen, onToggleMenu, onSignOut, bubblesEnabled = false, onToggleBubbles, bubbleScore = 0, onOpenGamePanel }: HeaderProps) {
  const { locale, setLocale, t } = useTranslation()
  const navigate = useNavigate()
  const [supportOpen, setSupportOpen] = useState(false)
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  )
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeModuleId, setActiveModuleId] = useState(
    () => localStorage.getItem(SETTINGS_KEYS.ACTIVE_MODULE) ?? DEFAULT_MODULE
  )

  const activeModule = AVAILABLE_MODULES.find(m => m.id === activeModuleId)

  function handleThemeToggle() {
    const nowDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem(SETTINGS_KEYS.DARK_MODE, String(nowDark))
    setIsDark(nowDark)
  }

  function selectModule(id: string) {
    setActiveModuleId(id)
    localStorage.setItem(SETTINGS_KEYS.ACTIVE_MODULE, id)
    setModuleDropdownOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background">
      <div className="flex h-full items-center px-4 overflow-hidden">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-3 md:hidden"
          onClick={onToggleMenu}
          aria-label={menuOpen ? t('header.closeMenu') : t('header.openMenu')}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <div className="flex items-center bg-background pr-3">
          <Link to="/home" className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
            🇩🇰 DanskPrep
          </Link>

          {/* Module selector dropdown */}
          <div className="relative ml-2">
            <button
              onClick={() => setModuleDropdownOpen(o => !o)}
              className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent transition-colors"
              aria-label={t('header.selectModule')}
            >
              {activeModule?.shortLabel ?? t('header.module')}
              <ChevronDown className="h-3 w-3" />
            </button>
            {moduleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-50"
                  onClick={() => setModuleDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 sm:left-auto mt-1 z-50 min-w-[180px] rounded-md border bg-background shadow-lg py-1">
                  {AVAILABLE_MODULES.map(mod => (
                    <button
                      key={mod.id}
                      onClick={() => mod.hasContent && selectModule(mod.id)}
                      disabled={!mod.hasContent}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                        !mod.hasContent
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-accent'
                      } ${
                        activeModuleId === mod.id ? 'font-medium text-primary' : ''
                      }`}
                    >
                      <span>{mod.label}</span>
                      {!mod.hasContent && (
                        <span className="text-[10px] text-muted-foreground ml-2">{t('header.soon')}</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>

        {/* Spacer + mobile search icon */}
        <div className="flex-1 flex items-center justify-center px-2 min-w-0 md:block">
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={() => navigate('/dictionary')}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border-2 border-pink-200 dark:border-pink-800/60 text-pink-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/30 shadow-[0_0_8px_rgba(236,72,153,0.15)] transition-all"
              title={t('header.lookupPlaceholder')}
              aria-label={t('header.lookupPlaceholder')}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-background pl-3 min-w-0 overflow-hidden">
          {/* Game controls — toggle + rankings, hidden on mobile */}
          <div className="hidden sm:flex items-center gap-0 rounded-lg border border-foreground/[0.08]">
            <button
              onClick={onToggleBubbles}
              className={`relative inline-flex items-center justify-center min-h-9 min-w-9 p-1.5 rounded-l-lg hover:bg-accent transition-colors ${bubblesEnabled ? 'text-blue-500' : 'text-muted-foreground/40'}`}
              title={bubblesEnabled ? t('bubble.game.turnOff') : t('bubble.game.turnOn')}
              aria-label={t('bubble.game.tooltip')}
            >
              <Gamepad2 className="h-4 w-4" />
              {!bubblesEnabled && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="block w-5 h-px bg-muted-foreground/60 rotate-45" />
                </span>
              )}
            </button>
            {bubblesEnabled && (
              <button
                onClick={onOpenGamePanel}
                className="inline-flex items-center gap-0.5 min-h-9 px-1.5 rounded-r-lg text-xs font-bold text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors border-l border-foreground/[0.08]"
                title={t('bubble.game.tooltip')}
                aria-label={t('bubble.game.tooltip')}
              >
                <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                {bubbleScore > 0 && <span>{bubbleScore}</span>}
              </button>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={handleThemeToggle}
            className="inline-flex items-center justify-center rounded-md min-h-11 min-w-11 p-2 text-muted-foreground hover:bg-accent transition-colors"
            title={isDark ? t('header.darkMode.light') : t('header.darkMode.dark')}
            aria-label={isDark ? t('header.darkMode.light') : t('header.darkMode.dark')}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLocale(locale === 'en' ? 'da' : 'en')}
            className="inline-flex items-center justify-center rounded-md min-h-11 min-w-11 p-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
            title={locale === 'en' ? 'Skift til dansk' : 'Switch to English'}
            aria-label={locale === 'en' ? 'Skift til dansk' : 'Switch to English'}
          >
            {locale === 'en' ? '\u{1F1E9}\u{1F1F0}' : '\u{1F1EC}\u{1F1E7}'}
          </button>

          <span className="w-px h-4 bg-foreground/[0.08] mx-0.5" />


          <button
            onClick={() => { setSupportOpen(true); track('support_click') }}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 h-9 text-xs font-medium text-muted-foreground hover:text-pink-500 hover:bg-accent transition-colors"
            aria-label={t('support.title')}
          >
            <Coffee className="h-4 w-4 text-pink-500" />
            <span className="hidden sm:inline">{t('support.title')}</span>
          </button>
          {user ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:block truncate max-w-[160px] ml-1">
                {user.email}
              </span>
              <Button variant="ghost" size="icon" onClick={onSignOut} aria-label={t('header.signOut')}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 h-9 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">{t('header.signIn')}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Desktop search — absolutely centered over the content area (after sidebar) */}
      <div className="hidden md:flex absolute inset-y-0 left-52 right-0 items-center justify-center pointer-events-none">
        <div className="max-w-xs w-full flex items-center gap-1.5 pointer-events-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  navigate(`/dictionary?q=${encodeURIComponent(searchTerm.trim())}`)
                  setSearchTerm('')
                }
              }}
              placeholder={t('header.lookupPlaceholder')}
              aria-label={t('header.lookupPlaceholder')}
              className="h-9 w-full rounded-lg border-2 border-pink-200 dark:border-pink-800/60 bg-pink-50/50 dark:bg-pink-950/20 pl-9 pr-3 text-sm placeholder:text-pink-300 dark:placeholder:text-pink-700 shadow-[0_0_8px_rgba(236,72,153,0.15)] focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-700 focus:border-pink-400 dark:focus:border-pink-600 focus:bg-background focus:shadow-[0_0_12px_rgba(236,72,153,0.25)] transition-all"
            />
          </div>
          <button
            onClick={() => navigate('/dictionary')}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border-2 border-pink-200 dark:border-pink-800/60 text-pink-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/30 shadow-[0_0_8px_rgba(236,72,153,0.15)] transition-all shrink-0"
            title={t('nav.dictionary')}
            aria-label={t('nav.dictionary')}
          >
            <BookOpen className="h-4 w-4" />
          </button>
        </div>
      </div>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </header>
  )
}
