import { useCallback, useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { SETTINGS_KEYS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { GameScaffold } from '../GameScaffold'
import { GameLeaderboard, saveGameScore } from '../GameLeaderboard'
import { useGameTimer } from '../useGameTimer'
import { useGenderSnap } from './useGenderSnap'
import type { GamePhase } from '../types'

const GAME_DURATION = 30

export function GenderSnapGame() {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0)

  const game = useGenderSnap()

  const handleTimeUp = useCallback(() => {
    game.endRound()
    setPhase('finished')

    // Save score to leaderboard
    const nickname = localStorage.getItem(SETTINGS_KEYS.BUBBLE_NICKNAME) || 'Player'
    saveGameScore('gender-snap', nickname, game.score)
    setLeaderboardRefresh((n) => n + 1)
  }, [game])

  const timer = useGameTimer({ duration: GAME_DURATION, onTimeUp: handleTimeUp })

  const handleStart = useCallback(() => {
    game.startRound()
    timer.start()
    setPhase('playing')
  }, [game, timer])

  const handlePlayAgain = useCallback(() => {
    timer.reset()
    setPhase('idle')
  }, [timer])

  return (
    <div>
      <GameScaffold
        phase={phase}
        timerProgress={timer.progress}
        timeLeft={timer.timeLeft}
        score={game.score}
        result={game.result}
        descriptionKey="game.genderSnap.description"
        onStart={handleStart}
        onPlayAgain={handlePlayAgain}
      >
        {/* Playing area */}
        {game.currentWord && (
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Streak indicator */}
            {game.streak > 1 && (
              <div className="text-xs font-medium text-amber-500 dark:text-amber-400">
                {t('game.streak', { count: String(game.streak) })}
              </div>
            )}

            {/* Word display */}
            <div
              className={cn(
                'text-2xl font-bold py-6 px-8 rounded-xl transition-colors duration-200 text-center w-full',
                game.feedback === 'correct'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : game.feedback === 'wrong'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-muted/50'
              )}
            >
              {game.currentWord.danish}
              {game.feedback === 'wrong' && game.correctGender && (
                <div className="text-sm font-normal mt-1 opacity-80">
                  {game.correctGender} {game.currentWord.danish}
                </div>
              )}
            </div>

            {/* en / et buttons */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => game.guess('en')}
                disabled={game.feedback !== null}
                className={cn(
                  'py-3 rounded-lg font-semibold text-lg transition-all min-h-12',
                  game.feedback === 'correct' && game.correctGender === null && game.currentWord.gender === 'en'
                    ? 'bg-green-500 text-white scale-105'
                    : game.feedback === 'wrong' && game.correctGender === 'en'
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50',
                  game.feedback !== null && 'cursor-default'
                )}
              >
                en
              </button>
              <button
                onClick={() => game.guess('et')}
                disabled={game.feedback !== null}
                className={cn(
                  'py-3 rounded-lg font-semibold text-lg transition-all min-h-12',
                  game.feedback === 'correct' && game.correctGender === null && game.currentWord.gender === 'et'
                    ? 'bg-green-500 text-white scale-105'
                    : game.feedback === 'wrong' && game.correctGender === 'et'
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50',
                  game.feedback !== null && 'cursor-default'
                )}
              >
                et
              </button>
            </div>
          </div>
        )}
      </GameScaffold>

      {/* Leaderboard — always visible below the game */}
      <GameLeaderboard gameId="gender-snap" refreshKey={leaderboardRefresh} />
    </div>
  )
}
