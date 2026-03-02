import { useState, useEffect, useCallback, useRef } from 'react'
import wordsData from '@/data/seed/words-pd3m2.json'
import { WordBubble } from './WordBubble'
import type { BubbleWord } from './WordBubble'
import { useTranslation } from '@/lib/i18n'

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

const MAX_BUBBLES = 15
const SIZES = ['sm', 'md', 'lg'] as const

interface ActiveBubble {
  id: number
  word: BubbleWord
  left: number
  delay: number
  duration: number
  sway: number
  size: (typeof SIZES)[number]
}

function randomBubble(id: number, delay: number): ActiveBubble {
  const word = BUBBLE_WORDS[Math.floor(Math.random() * BUBBLE_WORDS.length)]
  return {
    id,
    word,
    left: 3 + Math.random() * 94, // 3–97% to avoid edge clipping
    delay,
    duration: 12 + Math.random() * 10, // 12–22s
    sway: 10 + Math.random() * 30,    // 10–40px
    size: SIZES[Math.floor(Math.random() * SIZES.length)],
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

export function FloatingWords() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const [bubbles, setBubbles] = useState<ActiveBubble[]>([])
  const [discoveredCount, setDiscoveredCount] = useState(0)
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
    setDiscoveredCount((c) => c + 1)
  }, [])

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
    <>
      <div className="absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
        {bubbles.map((bubble) => (
          <WordBubble
            key={bubble.id}
            word={bubble.word}
            left={bubble.left}
            delay={bubble.delay}
            duration={bubble.duration}
            sway={bubble.sway}
            size={bubble.size}
            onComplete={() => handleComplete(bubble.id)}
            onDiscover={handleDiscover}
          />
        ))}
      </div>

      {/* Discovery counter */}
      {discoveredCount > 0 && (
        <div className="fixed bottom-4 right-4 z-30 rounded-full bg-card/80 backdrop-blur border px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          {t('welcome.wordsDiscovered', { count: String(discoveredCount) })}
        </div>
      )}
    </>
  )
}
