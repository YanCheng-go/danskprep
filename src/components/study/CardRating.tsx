import type { SchedulingOptions } from '@/types/study'
import { cn } from '@/lib/utils'

interface CardRatingProps {
  schedulingOptions: SchedulingOptions | null
  onRate: (rating: 1 | 2 | 3 | 4) => void
  disabled?: boolean
}

const RATINGS: Array<{ rating: 1 | 2 | 3 | 4; label: string; colorClass: string }> = [
  { rating: 1, label: 'Again', colorClass: 'border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950' },
  { rating: 2, label: 'Hard', colorClass: 'border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950' },
  { rating: 3, label: 'Good', colorClass: 'border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-950' },
  { rating: 4, label: 'Easy', colorClass: 'border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950' },
]

export function CardRating({ schedulingOptions, onRate, disabled }: CardRatingProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {RATINGS.map(({ rating, label, colorClass }) => {
        const opt = schedulingOptions?.[rating]
        return (
          <button
            key={rating}
            onClick={() => onRate(rating)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center justify-center rounded-md border py-3 px-1 transition-colors min-h-11 disabled:opacity-50 disabled:pointer-events-none',
              colorClass
            )}
          >
            <span className="text-sm font-medium">{label}</span>
            {opt && (
              <span className="text-xs opacity-70 mt-0.5">{opt.label}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
