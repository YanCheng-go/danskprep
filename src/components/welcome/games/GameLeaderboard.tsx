import { Trophy } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { GAME_SCORES_PREFIX } from '@/lib/constants'
import type { GameId } from './types'

interface ScoreEntry {
  nickname: string
  score: number
  date: string
}

function getStorageKey(gameId: GameId): string {
  return `${GAME_SCORES_PREFIX}${gameId}_scores`
}

export function getGameScores(gameId: GameId): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(getStorageKey(gameId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveGameScore(gameId: GameId, nickname: string, score: number): ScoreEntry[] {
  const scores = getGameScores(gameId)
  scores.push({ nickname, score, date: new Date().toISOString() })
  // Keep top 10 by score descending
  scores.sort((a, b) => b.score - a.score)
  const top10 = scores.slice(0, 10)
  localStorage.setItem(getStorageKey(gameId), JSON.stringify(top10))
  return top10
}

interface GameLeaderboardProps {
  gameId: GameId
  /** Trigger re-render when scores change */
  refreshKey: number
}

export function GameLeaderboard({ gameId, refreshKey: _refreshKey }: GameLeaderboardProps) {
  const { t } = useTranslation()
  const scores = getGameScores(gameId)

  if (scores.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        {t('game.leaderboard.empty')}
      </p>
    )
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Trophy className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-xs font-medium text-muted-foreground">{t('game.leaderboard.title')}</span>
      </div>
      <div className="space-y-1">
        {scores.map((entry, i) => (
          <div
            key={`${entry.nickname}-${entry.date}`}
            className="flex items-center gap-2 text-xs py-1 px-2 rounded-md bg-muted/30"
          >
            <span className="w-4 text-muted-foreground font-mono">{i + 1}</span>
            <span className="flex-1 truncate">{entry.nickname}</span>
            <span className="font-semibold tabular-nums">{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
