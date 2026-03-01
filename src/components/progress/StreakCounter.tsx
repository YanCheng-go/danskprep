interface StreakCounterProps {
  streakDays: number
}

export function StreakCounter({ streakDays }: StreakCounterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">{streakDays > 0 ? '🔥' : '❄️'}</span>
      <div>
        <p className="text-2xl font-bold leading-none">{streakDays}</p>
        <p className="text-xs text-muted-foreground">
          {streakDays === 1 ? 'day streak' : 'day streak'}
        </p>
      </div>
    </div>
  )
}
