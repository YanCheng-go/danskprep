import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

export interface BubbleWord {
  danish: string
  english: string
  gender?: string
  part_of_speech?: string
}

interface WordBubbleProps {
  word: BubbleWord
  left: number        // percentage 0–100
  delay: number       // seconds
  duration: number    // seconds
  sway: number        // px, horizontal sway amplitude
  size: 'sm' | 'md' | 'lg'
  onComplete: () => void
  onDiscover: () => void
}

const SIZE_CLASSES = {
  sm: 'text-xs px-3 py-1.5 min-h-11 min-w-11',
  md: 'text-sm px-4 py-2 min-h-11 min-w-11',
  lg: 'text-base px-5 py-2.5 min-h-11 min-w-11',
} as const

export function WordBubble({
  word,
  left,
  delay,
  duration,
  sway,
  size,
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

  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={handleClick}
      className={cn(
        'absolute rounded-full border cursor-pointer select-none whitespace-nowrap transition-colors',
        SIZE_CLASSES[size],
        exiting
          ? 'animate-bubble-fade-out'
          : 'animate-bubble-rise',
        flipped
          ? 'ring-2 ring-green-400/50 bg-green-50/80 dark:bg-green-950/40 border-green-300/50 dark:border-green-700/50'
          : 'bg-primary/5 border-primary/20 hover:bg-primary/15 hover:border-primary/40',
      )}
      style={{
        left: `${left}%`,
        animationDelay: exiting ? '0s' : `${delay}s`,
        animationDuration: exiting ? '0.5s' : `${duration}s`,
        '--sway': `${sway}px`,
        '--bubble-duration': `${duration}s`,
        // Stay invisible until animation starts
        ...(delay > 0 && !flipped && !exiting
          ? { opacity: 0, animationFillMode: 'forwards' }
          : {}),
      } as React.CSSProperties}
      onAnimationEnd={(e) => {
        // When the rise animation ends naturally, recycle the bubble
        if (e.animationName.includes('bubble-rise') && !flipped) {
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
          <span className="text-foreground/20 hover:text-foreground/40 transition-colors font-medium">
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
