import { useEffect } from 'react'
import type { SchedulingOptions } from '@/types/study'
import { cn } from '@/lib/utils'

interface CardRatingProps {
  schedulingOptions: SchedulingOptions | null
  onRate: (rating: 1 | 2 | 3 | 4) => void
  disabled?: boolean
  /** Pre-suggested rating based on active-recall answer correctness */
  suggestedRating?: 1 | 2 | 3 | 4
}

const RATINGS: Array<{ rating: 1 | 2 | 3 | 4; label: string; colorClass: string; suggestedClass: string }> = [
  {
    rating: 1, label: 'Again',
    colorClass:    'border-red-300    text-red-600    hover:bg-red-50    dark:hover:bg-red-950',
    suggestedClass: 'border-red-500    bg-red-50      text-red-700      ring-2 ring-red-400    dark:bg-red-950 dark:text-red-300',
  },
  {
    rating: 2, label: 'Hard',
    colorClass:    'border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950',
    suggestedClass: 'border-orange-500 bg-orange-50   text-orange-700   ring-2 ring-orange-400 dark:bg-orange-950 dark:text-orange-300',
  },
  {
    rating: 3, label: 'Good',
    colorClass:    'border-green-300  text-green-600  hover:bg-green-50  dark:hover:bg-green-950',
    suggestedClass: 'border-green-500  bg-green-50    text-green-700    ring-2 ring-green-400   dark:bg-green-950 dark:text-green-300',
  },
  {
    rating: 4, label: 'Easy',
    colorClass:    'border-blue-300   text-blue-600   hover:bg-blue-50   dark:hover:bg-blue-950',
    suggestedClass: 'border-blue-500   bg-blue-50     text-blue-700     ring-2 ring-blue-400    dark:bg-blue-950 dark:text-blue-300',
  },
]

export function CardRating({ schedulingOptions, onRate, disabled, suggestedRating }: CardRatingProps) {
  // Keyboard shortcuts: 1=Again, 2=Hard, 3=Good, 4=Easy
  useEffect(() => {
    if (disabled) return
    function handleKey(e: KeyboardEvent) {
      if (['1', '2', '3', '4'].includes(e.key)) {
        onRate(Number(e.key) as 1 | 2 | 3 | 4)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onRate, disabled])

  return (
    <div className="space-y-2">
      {suggestedRating && (
        <p className="text-xs text-center text-muted-foreground">
          Suggested rating highlighted — tap to confirm or choose differently
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {RATINGS.map(({ rating, label, colorClass, suggestedClass }) => {
          const opt = schedulingOptions?.[rating]
          const isSuggested = suggestedRating === rating
          return (
            <button
              key={rating}
              onClick={() => onRate(rating)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center justify-center rounded-md border py-3 px-1 transition-colors min-h-11 disabled:opacity-50 disabled:pointer-events-none',
                isSuggested ? suggestedClass : colorClass
              )}
            >
              <span className="text-sm font-medium">{label}</span>
              {opt && (
                <span className="text-xs opacity-70 mt-0.5">{opt.label}</span>
              )}
              <span className="text-xs opacity-40 mt-0.5">{isSuggested ? '↑' : rating}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
