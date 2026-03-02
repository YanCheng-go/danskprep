import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, ChevronDown, Coffee, Search, BookOpen } from 'lucide-react'
import { track } from '@vercel/analytics'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AVAILABLE_MODULES, DEFAULT_MODULE, SETTINGS_KEYS } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User | null
  menuOpen: boolean
  onToggleMenu: () => void
  onSignOut: () => void
}

// Hardcoded — not in i18n translations to reduce exposure if site is compromised
const MOBILEPAY_NUMBER = ['+45', '5272', '8520'].join(' ')

export function Header({ user, menuOpen, onToggleMenu, onSignOut }: HeaderProps) {
  const { locale, setLocale, t } = useTranslation()
  const navigate = useNavigate()
  const [supportOpen, setSupportOpen] = useState(false)
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeModuleId, setActiveModuleId] = useState(
    () => localStorage.getItem(SETTINGS_KEYS.ACTIVE_MODULE) ?? DEFAULT_MODULE
  )

  const activeModule = AVAILABLE_MODULES.find(m => m.id === activeModuleId)

  function selectModule(id: string) {
    setActiveModuleId(id)
    localStorage.setItem(SETTINGS_KEYS.ACTIVE_MODULE, id)
    setModuleDropdownOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b bg-background px-4">
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

      <span className="text-lg font-bold tracking-tight">
        🇩🇰 DanskPrep
      </span>

      {/* Module selector dropdown */}
      <div className="relative ml-2">
        <button
          onClick={() => setModuleDropdownOpen(o => !o)}
          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent transition-colors"
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
            <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] rounded-md border bg-background shadow-lg py-1">
              {AVAILABLE_MODULES.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => selectModule(mod.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between ${
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

      {/* Language toggle */}
      <button
        onClick={() => setLocale(locale === 'en' ? 'da' : 'en')}
        className="ml-2 rounded-md border px-1.5 py-0.5 text-sm hover:bg-accent transition-colors"
        title={locale === 'en' ? 'Skift til dansk' : 'Switch to English'}
        aria-label={locale === 'en' ? 'Skift til dansk' : 'Switch to English'}
      >
        {locale === 'en' ? '\u{1F1E9}\u{1F1F0}' : '\u{1F1EC}\u{1F1E7}'}
      </button>

      {/* Dictionary search — centered, hidden on mobile */}
      <div className="hidden sm:flex flex-1 justify-center px-2">
        <div className="flex items-center gap-1 max-w-xs w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
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
              className="h-8 w-full rounded-md border bg-background pl-8 pr-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>
          <button
            onClick={() => navigate('/dictionary')}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            title={t('nav.dictionary')}
            aria-label={t('nav.dictionary')}
          >
            <BookOpen className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="ml-auto sm:ml-0 flex items-center gap-1">
        <button
          onClick={() => { setSupportOpen(true); track('support_click') }}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 h-9 text-xs font-medium text-muted-foreground hover:text-pink-500 hover:bg-accent transition-colors"
        >
          <Coffee className="h-4 w-4 text-pink-500" />
          <span className="hidden sm:inline">{t('support.title')}</span>
        </button>
        {user && (
          <>
            <span className="hidden text-xs text-muted-foreground sm:block truncate max-w-[160px] ml-1">
              {user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={onSignOut} aria-label={t('header.signOut')}>
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-pink-500" />
              {t('support.dialogTitle')}
            </DialogTitle>
            <DialogDescription>{t('support.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="rounded-lg border-2 border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-950 px-6 py-3">
              <p className="text-2xl font-bold tracking-wider text-center select-all">{MOBILEPAY_NUMBER}</p>
            </div>
            <p className="text-xs text-muted-foreground text-center">{t('support.thankYou')}</p>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
