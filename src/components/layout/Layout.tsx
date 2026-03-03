import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Agentation } from 'agentation'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { FloatingWords } from '@/components/welcome/FloatingWords'
import { GamePanel } from '@/components/welcome/GamePanel'
import { ChatButton } from '@/components/chat/ChatButton'
import { useAuth } from '@/hooks/useAuth'
import { useBubbleGame } from '@/hooks/useBubbleGame'
import { SETTINGS_KEYS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function Layout() {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const {
    bubbleScore, setBubbleScore,
    gamePanelOpen, setGamePanelOpen,
    bubblesEnabled, toggleBubbles,
  } = useBubbleGame()

  function handleSignOut() {
    // Reset bubble game state — new session on next login
    // Keep BUBBLE_SCORES (leaderboard) — it repopulates from Supabase
    setBubbleScore(0)
    setGamePanelOpen(false)
    localStorage.removeItem(SETTINGS_KEYS.BUBBLE_NICKNAME)
    signOut()
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header
        user={user}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(o => !o)}
        onSignOut={handleSignOut}
        bubblesEnabled={bubblesEnabled}
        onToggleBubbles={toggleBubbles}
        bubbleScore={bubbleScore}
        onOpenGamePanel={() => setGamePanelOpen(o => !o)}
      />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-52 shrink-0 border-r h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
          <Sidebar user={user} />
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
          <Sidebar user={user} onClose={() => setMenuOpen(false)} />
        </aside>

        {/* Main content — z-20 to stack above z-10 floating bubbles */}
        <div className="flex-1 min-w-0 relative z-20">
          <Outlet />
        </div>

        {/* Game rankings panel — inline, squeezes main content */}
        <GamePanel
          open={gamePanelOpen}
          onClose={() => setGamePanelOpen(false)}
          currentScore={bubbleScore}
          onScoreReset={() => setBubbleScore(0)}
          onScoreLoad={(score) => setBubbleScore(score)}
        />
      </div>

      {/* Floating word bubbles — decorative background, non-interactive in Layout
           so bubbles never block clicks on content (quiz buttons, etc.) */}
      {bubblesEnabled && (
        <FloatingWords score={bubbleScore} onScoreChange={setBubbleScore} interactive={false} />
      )}

      {/* Floating chat */}
      <ChatButton />

      {/* Dev-only: visual annotation tool for UI feedback */}
      {import.meta.env.DEV && <Agentation />}
    </div>
  )
}
