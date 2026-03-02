import { Play, RotateCcw } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import type { GamePhase, GameResult } from './types'

interface GameScaffoldProps {
  phase: GamePhase
  /** Timer progress 0–1 (0 = full time, 1 = time's up) */
  timerProgress: number
  /** Seconds remaining — shown as integer */
  timeLeft: number
  /** Current score during play */
  score: number
  /** End-of-game result */
  result: GameResult | null
  /** Game description translation key */
  descriptionKey: string
  /** Called when user clicks "Start" */
  onStart: () => void
  /** Called when user clicks "Play Again" */
  onPlayAgain: () => void
  /** The active game area (rendered during 'playing' phase) */
  children: React.ReactNode
}

export function GameScaffold({
  phase,
  timerProgress,
  timeLeft,
  score,
  result,
  descriptionKey,
  onStart,
  onPlayAgain,
  children,
}: GameScaffoldProps) {
  const { t } = useTranslation()

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <p className="text-sm text-muted-foreground text-center leading-relaxed px-2">
          {t(descriptionKey)}
        </p>
        <button
          onClick={onStart}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors min-h-11"
        >
          <Play className="h-4 w-4" />
          {t('game.start')}
        </button>
      </div>
    )
  }

  if (phase === 'finished' && result) {
    return (
      <div className="flex flex-col items-center py-6 gap-3">
        <div className="text-3xl font-bold text-primary">{result.score}</div>
        <p className="text-sm text-muted-foreground">{t('game.finalScore')}</p>

        <div className="grid grid-cols-2 gap-3 w-full mt-2">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold">{result.total}</div>
            <div className="text-xs text-muted-foreground">{t('game.answered')}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold">{Math.round(result.accuracy)}%</div>
            <div className="text-xs text-muted-foreground">{t('game.accuracy')}</div>
          </div>
          <div className="col-span-2 bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold">{result.bestStreak}</div>
            <div className="text-xs text-muted-foreground">{t('game.bestStreak')}</div>
          </div>
        </div>

        <button
          onClick={onPlayAgain}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors mt-2 min-h-11"
        >
          <RotateCcw className="h-4 w-4" />
          {t('game.playAgain')}
        </button>
      </div>
    )
  }

  // Playing phase
  return (
    <div className="flex flex-col gap-3">
      {/* Timer bar + score */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${(1 - timerProgress) * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground w-8 text-right tabular-nums">
          {Math.ceil(timeLeft)}s
        </span>
        <span className="text-sm font-semibold text-primary w-8 text-right tabular-nums">
          {score}
        </span>
      </div>

      {/* Game content */}
      {children}
    </div>
  )
}
