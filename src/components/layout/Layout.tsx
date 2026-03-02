import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { ChatButton } from '@/components/chat/ChatButton'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function Layout() {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(o => !o)}
        onSignOut={signOut}
      />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-52 shrink-0 border-r h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
          <Sidebar />
        </aside>

        {/* Mobile drawer overlay */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={cn(
            'fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 bg-background border-r transition-transform duration-200 md:hidden overflow-y-auto',
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <Sidebar onClose={() => setMenuOpen(false)} />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>

      {/* Floating chat */}
      <ChatButton />
    </div>
  )
}
