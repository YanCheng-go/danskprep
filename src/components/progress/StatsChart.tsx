import { Progress } from '@/components/ui/progress'

interface StatBarProps {
  label: string
  value: number
  total: number
  colorClass: string
}

function StatBar({ label, value, total, colorClass }: StatBarProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={`font-medium ${colorClass}`}>{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <Progress value={pct} className={`h-2 [&>div]:${colorClass.replace('text-', 'bg-')}`} />
    </div>
  )
}

interface StatsChartProps {
  newCards: number
  learning: number
  review: number
  relearning: number
  total: number
}

export function StatsChart({ newCards, learning, review, relearning, total }: StatsChartProps) {
  return (
    <div className="space-y-3">
      <StatBar label="New" value={newCards} total={total} colorClass="text-blue-500" />
      <StatBar label="Learning" value={learning} total={total} colorClass="text-orange-500" />
      <StatBar label="Review" value={review} total={total} colorClass="text-green-500" />
      <StatBar label="Relearning" value={relearning} total={total} colorClass="text-red-500" />
    </div>
  )
}
