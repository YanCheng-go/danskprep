import { Menu, X, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User | null
  menuOpen: boolean
  onToggleMenu: () => void
  onSignOut: () => void
}

export function Header({ user, menuOpen, onToggleMenu, onSignOut }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b bg-background px-4">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="mr-3 md:hidden"
        onClick={onToggleMenu}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <span className="text-lg font-bold tracking-tight">
        🇩🇰 DanskPrep
      </span>

      <div className="ml-auto flex items-center gap-2">
        {user && (
          <>
            <span className="hidden text-xs text-muted-foreground sm:block truncate max-w-[160px]">
              {user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
