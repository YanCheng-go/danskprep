import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

export interface BubbleWord {
  danish: string
  english: string
  gender?: string
  part_of_speech?: string
}

export interface BubbleColorClasses {
  bg: string
  border: string
  hoverBg: string
  hoverBorder: string
  text: string
}

interface WordBubbleProps {
  word: BubbleWord
  left: number        // percentage 0–100
  delay: number       // seconds
  duration: number    // seconds
  sway: number        // px, horizontal sway amplitude
  size: 'sm' | 'md' | 'lg'
  colorClasses?: BubbleColorClasses
  onComplete: () => void
  onDiscover: () => void
}

const SIZE_CLASSES = {
  sm: 'text-sm px-4 py-2 min-h-[48px] min-w-[48px]',
  md: 'text-base px-5 py-2.5 min-h-[56px] min-w-[56px]',
  lg: 'text-lg px-6 py-3 min-h-[64px] min-w-[64px]',
} as const

export function WordBubble({
  word,
  left,
  delay,
  duration,
  sway,
  size,
  colorClasses,
  onComplete,
  onDiscover,
}: WordBubbleProps) {
  const [flipped, setFlipped] = useState(false)
  const [exiting, setExiting] = useState(false)

  const handleClick = useCallback(() => {
    if (flipped) return
    setFlipped(true)
    onDiscover()
    // After showing translation, fade out and recycle
    const timer = setTimeout(() => {
      setExiting(true)
      const exitTimer = setTimeout(() => {
        onComplete()
      }, 500) // match bubble-fade-out duration
      return () => clearTimeout(exitTimer)
    }, 2000)
    return () => clearTimeout(timer)
  }, [flipped, onDiscover, onComplete])

  // Inline animation — matches HTML prototype approach exactly.
  // Avoids Tailwind class + inline longhand specificity conflicts.
  const animation = exiting
    ? 'bubble-fade-out 0.5s ease-out forwards'
    : `bubble-rise ${duration}s linear ${delay}s forwards`

  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={handleClick}
      className={cn(
        'absolute rounded-full border cursor-pointer select-none whitespace-nowrap transition-colors pointer-events-auto',
        SIZE_CLASSES[size],
        flipped
          ? 'ring-2 ring-green-400/50 bg-green-50/80 dark:bg-green-950/40 border-green-300/50 dark:border-green-700/50'
          : colorClasses
            ? `${colorClasses.bg} ${colorClasses.border} ${colorClasses.hoverBg} ${colorClasses.hoverBorder}`
            : 'bg-primary/5 border-primary/20 hover:bg-primary/15 hover:border-primary/40',
      )}
      style={{
        left: `${left}%`,
        opacity: 0,
        animation,
        '--sway': `${sway}px`,
      } as React.CSSProperties}
      onAnimationEnd={(e) => {
        // When the rise animation ends naturally, recycle the bubble
        if (e.animationName === 'bubble-rise' && !flipped) {
          onComplete()
        }
      }}
    >
      {flipped ? (
        <span className="flex flex-col items-center gap-0.5">
          <span className="font-semibold text-green-700 dark:text-green-400">
            {word.danish}
          </span>
          <span className="text-green-600/80 dark:text-green-400/70 text-[0.7em]">
            {word.english}
          </span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <span className={cn(
            'transition-colors font-medium',
            colorClasses ? `${colorClasses.text} hover:text-foreground/60` : 'text-foreground/50 hover:text-foreground/70'
          )}>
            {word.danish}
          </span>
          {word.gender && (
            <span className="text-primary/30 text-[0.65em] font-normal">
              {word.gender}
            </span>
          )}
        </span>
      )}
    </button>
  )
}
