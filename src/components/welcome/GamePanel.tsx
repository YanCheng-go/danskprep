import { useEffect, useCallback } from 'react'
import { Gamepad2, X } from 'lucide-react'
import { BubbleLeaderboard } from './BubbleLeaderboard'
import { useTranslation } from '@/lib/i18n'

interface GamePanelProps {
  open: boolean
  onClose: () => void
  currentScore: number
  onScoreReset?: () => void
  /** Called when a stored score is loaded (session restore or nickname resume) */
  onScoreLoad?: (score: number) => void
}

export function GamePanel({ open, onClose, currentScore, onScoreReset, onScoreLoad }: GamePanelProps) {
  const { t } = useTranslation()

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open, handleEscape])

  return (
    <aside
      className="shrink-0 border-l border-foreground/[0.08] bg-background overflow-hidden transition-[width] duration-300 ease-in-out h-[calc(100vh-3.5rem)] sticky top-14"
      style={{ width: open ? '384px' : '0px' }}
    >
      <div className="w-96 pt-6 px-5 pb-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">{t('bubble.leaderboard.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-foreground/[0.05] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {t('bubble.game.description')}
        </p>

        {/* Leaderboard */}
        <BubbleLeaderboard currentScore={currentScore} onScoreReset={onScoreReset} onScoreLoad={onScoreLoad} />
      </div>
    </aside>
  )
}
