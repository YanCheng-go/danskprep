import { useState, useCallback, useRef } from 'react'
import wordsData from '@/data/seed/words-pd3m2.json'
import type { GameResult } from '../types'

interface WordItem {
  danish: string
  english: string
  gender: 'en' | 'et'
}

export type AnswerFeedback = 'correct' | 'wrong' | null

interface UseGenderSnapReturn {
  /** Current word to guess */
  currentWord: WordItem | null
  /** Number of correct answers */
  score: number
  /** Current streak */
  streak: number
  /** Best streak this session */
  bestStreak: number
  /** Total questions answered */
  totalAnswered: number
  /** Feedback flash state */
  feedback: AnswerFeedback
  /** The correct gender (shown on wrong answer) */
  correctGender: 'en' | 'et' | null
  /** Game result (set when game ends) */
  result: GameResult | null
  /** Handle player's guess */
  guess: (gender: 'en' | 'et') => void
  /** Start a new round — shuffles words and resets state */
  startRound: () => void
  /** End the round and compute result */
  endRound: () => void
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Filter words to only nouns with gender defined */
function getGenderedNouns(): WordItem[] {
  return (wordsData as Array<{ danish: string; english: string; part_of_speech: string; gender?: string }>)
    .filter((w) => w.part_of_speech === 'noun' && (w.gender === 'en' || w.gender === 'et'))
    .map((w) => ({ danish: w.danish, english: w.english, gender: w.gender as 'en' | 'et' }))
}

export function useGenderSnap(): UseGenderSnapReturn {
  const [words, setWords] = useState<WordItem[]>([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [feedback, setFeedback] = useState<AnswerFeedback>(null)
  const [correctGender, setCorrectGender] = useState<'en' | 'et' | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Prevent rapid double-taps while feedback is showing
  const lockedRef = useRef(false)

  const currentWord = words.length > 0 && index < words.length ? words[index] : null

  const clearFeedbackTimeout = useCallback(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = null
    }
  }, [])

  const advance = useCallback(() => {
    setIndex((prev) => {
      const next = prev + 1
      // If we've exhausted all words, reshuffle and start over
      if (next >= words.length) {
        setWords(shuffleArray(words))
        return 0
      }
      return next
    })
    setFeedback(null)
    setCorrectGender(null)
    lockedRef.current = false
  }, [words])

  const guess = useCallback(
    (gender: 'en' | 'et') => {
      if (!currentWord || lockedRef.current) return
      lockedRef.current = true

      clearFeedbackTimeout()
      setTotalAnswered((t) => t + 1)

      const isCorrect = gender === currentWord.gender

      if (isCorrect) {
        setFeedback('correct')
        setScore((s) => s + 1)
        setStreak((s) => {
          const newStreak = s + 1
          setBestStreak((best) => Math.max(best, newStreak))
          return newStreak
        })
        // Advance quickly on correct
        feedbackTimeoutRef.current = setTimeout(advance, 400)
      } else {
        setFeedback('wrong')
        setCorrectGender(currentWord.gender)
        setStreak(0)
        // Show correct answer longer on wrong
        feedbackTimeoutRef.current = setTimeout(advance, 800)
      }
    },
    [currentWord, clearFeedbackTimeout, advance]
  )

  const startRound = useCallback(() => {
    clearFeedbackTimeout()
    lockedRef.current = false
    const nouns = getGenderedNouns()
    setWords(shuffleArray(nouns))
    setIndex(0)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setTotalAnswered(0)
    setFeedback(null)
    setCorrectGender(null)
    setResult(null)
  }, [clearFeedbackTimeout])

  const endRound = useCallback(() => {
    clearFeedbackTimeout()
    lockedRef.current = false
    setFeedback(null)
    setCorrectGender(null)
    setResult({
      score,
      total: totalAnswered,
      accuracy: totalAnswered > 0 ? (score / totalAnswered) * 100 : 0,
      bestStreak,
    })
  }, [clearFeedbackTimeout, score, totalAnswered, bestStreak])

  return {
    currentWord,
    score,
    streak,
    bestStreak,
    totalAnswered,
    feedback,
    correctGender,
    result,
    guess,
    startRound,
    endRound,
  }
}
