import { Circle, Zap, MessageSquare, Timer, ArrowUpDown } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { GAME_CONFIGS } from './types'
import type { GameId } from './types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Circle,
  Zap,
  MessageSquare,
  Timer,
  ArrowUpDown,
}

interface GameSelectorProps {
  activeGame: GameId
  onSelect: (id: GameId) => void
}

export function GameSelector({ activeGame, onSelect }: GameSelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
      {GAME_CONFIGS.map((game) => {
        const Icon = ICON_MAP[game.icon]
        const isActive = activeGame === game.id
        const isDisabled = !game.enabled

        return (
          <button
            key={game.id}
            onClick={() => !isDisabled && onSelect(game.id)}
            disabled={isDisabled}
            title={t(game.titleKey)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-8',
              isActive
                ? 'bg-primary text-primary-foreground'
                : isDisabled
                  ? 'bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {t(game.titleKey)}
          </button>
        )
      })}
    </div>
  )
}
