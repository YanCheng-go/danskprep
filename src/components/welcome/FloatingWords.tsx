import { useState, useEffect, useCallback, useRef } from 'react'
import wordsData from '@/data/seed/words-pd3m2.json'
import { WordBubble } from './WordBubble'
import type { BubbleWord, BubbleColorClasses } from './WordBubble'

const BUBBLE_COLORS: BubbleColorClasses[] = [
  { bg: 'bg-blue-500/[0.12]', border: 'border-blue-400/30', hoverBg: 'hover:bg-blue-500/20', hoverBorder: 'hover:border-blue-400/50', text: 'text-blue-600/70 dark:text-blue-300/70' },
  { bg: 'bg-violet-500/[0.12]', border: 'border-violet-400/30', hoverBg: 'hover:bg-violet-500/20', hoverBorder: 'hover:border-violet-400/50', text: 'text-violet-600/70 dark:text-violet-300/70' },
  { bg: 'bg-pink-500/[0.12]', border: 'border-pink-400/30', hoverBg: 'hover:bg-pink-500/20', hoverBorder: 'hover:border-pink-400/50', text: 'text-pink-600/70 dark:text-pink-300/70' },
  { bg: 'bg-green-500/[0.12]', border: 'border-green-400/30', hoverBg: 'hover:bg-green-500/20', hoverBorder: 'hover:border-green-400/50', text: 'text-green-600/70 dark:text-green-300/70' },
  { bg: 'bg-orange-500/[0.12]', border: 'border-orange-400/30', hoverBg: 'hover:bg-orange-500/20', hoverBorder: 'hover:border-orange-400/50', text: 'text-orange-600/70 dark:text-orange-300/70' },
  { bg: 'bg-cyan-500/[0.12]', border: 'border-cyan-400/30', hoverBg: 'hover:bg-cyan-500/20', hoverBorder: 'hover:border-cyan-400/50', text: 'text-cyan-600/70 dark:text-cyan-300/70' },
]

// Filter to short words with translations — good for bubble display
const BUBBLE_WORDS: BubbleWord[] = (wordsData as Array<{
  danish: string
  english: string
  gender?: string
  part_of_speech?: string
}>)
  .filter((w) => w.danish.length <= 10 && w.english.length > 0)
  .map(({ danish, english, gender, part_of_speech }) => ({
    danish,
    english,
    gender,
    part_of_speech,
  }))

const MAX_BUBBLES = 12
// Bias toward larger sizes: 80% md/lg, 20% sm
const SIZES = ['md', 'md', 'lg', 'lg', 'sm'] as const

interface ActiveBubble {
  id: number
  word: BubbleWord
  left: number
  delay: number
  duration: number
  sway: number
  size: (typeof SIZES)[number]
  colorClasses: BubbleColorClasses
}

function randomBubble(id: number, delay: number): ActiveBubble {
  const word = BUBBLE_WORDS[Math.floor(Math.random() * BUBBLE_WORDS.length)]
  return {
    id,
    word,
    left: 5 + Math.random() * 85, // 5–90% to avoid edge clipping on mobile
    delay,
    duration: 12 + Math.random() * 10, // 12–22s
    sway: 10 + Math.random() * 30,    // 10–40px
    size: SIZES[Math.floor(Math.random() * SIZES.length)],
    colorClasses: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
  }
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}

interface FloatingWordsProps {
  score?: number
  onScoreChange?: (count: number) => void
}

export function FloatingWords({ score = 0, onScoreChange }: FloatingWordsProps) {
  const reducedMotion = useReducedMotion()
  const [bubbles, setBubbles] = useState<ActiveBubble[]>([])
  const discoveredCountRef = useRef(score)

  // Sync internal counter when parent resets score (e.g. guest nickname shuffle)
  useEffect(() => {
    discoveredCountRef.current = score
  }, [score])
  const nextIdRef = useRef(0)
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  // Determine initial count based on viewport
  const getInitialCount = useCallback(() => {
    if (typeof window === 'undefined') return 8
    return window.matchMedia('(max-width: 640px)').matches ? 8 : 12
  }, [])

  // Initialize bubbles on mount
  useEffect(() => {
    if (reducedMotion) return

    const count = getInitialCount()
    const initial: ActiveBubble[] = []
    for (let i = 0; i < count; i++) {
      initial.push(randomBubble(nextIdRef.current++, i * 1.5)) // stagger by 1.5s
    }
    setBubbles(initial)

    return () => {
      // Cleanup all timeouts
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current.clear()
    }
  }, [reducedMotion, getInitialCount])

  const handleComplete = useCallback((id: number) => {
    setBubbles((prev) => {
      const filtered = prev.filter((b) => b.id !== id)
      if (filtered.length < MAX_BUBBLES) {
        // Spawn a replacement with no delay
        return [...filtered, randomBubble(nextIdRef.current++, 0)]
      }
      return filtered
    })
  }, [])

  const handleDiscover = useCallback(() => {
    discoveredCountRef.current += 1
    onScoreChange?.(discoveredCountRef.current)
  }, [onScoreChange])

  // Reduced motion: show static scattered words
  if (reducedMotion) {
    const staticWords = BUBBLE_WORDS.slice(0, 8)
    return (
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        {staticWords.map((word, i) => (
          <span
            key={word.danish}
            className="absolute text-foreground/10 text-sm font-medium"
            style={{
              left: `${10 + (i % 4) * 22}%`,
              top: `${10 + Math.floor(i / 4) * 40}%`,
            }}
          >
            {word.danish}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {bubbles.map((bubble) => (
        <WordBubble
          key={bubble.id}
          word={bubble.word}
          left={bubble.left}
          delay={bubble.delay}
          duration={bubble.duration}
          sway={bubble.sway}
          size={bubble.size}
          colorClasses={bubble.colorClasses}
          onComplete={() => handleComplete(bubble.id)}
          onDiscover={handleDiscover}
        />
      ))}
    </div>
  )
}
