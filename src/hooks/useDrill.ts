import { useCallback, useRef, useState } from 'react'
import { checkAnswer } from '@/lib/answer-check'
import type { AnswerResult } from '@/types/quiz'
import type { DrillQuestion, DrillAnswer, DrillSession, DrillStats, DrillRoundType } from '@/types/drill'
import { SETTINGS_KEYS } from '@/lib/constants'

const ALL_ROUND_TYPES: DrillRoundType[] = [
  'translation_en_da',
  'translation_da_en',
  'context_cloze',
  'paradigm_fill',
  'form_choice',
]

function emptyByRoundType(): Record<DrillRoundType, { total: number; correct: number }> {
  const result = {} as Record<DrillRoundType, { total: number; correct: number }>
  for (const rt of ALL_ROUND_TYPES) {
    result[rt] = { total: 0, correct: 0 }
  }
  return result
}

interface UseDrillReturn {
  currentQuestion: DrillQuestion | null
  currentIndex: number
  showFeedback: boolean
  lastResult: AnswerResult | null
  lastResponse: string
  stats: DrillStats
  progress: number  // 0–1
  session: DrillSession
  submitAnswer: (response: string) => void
  nextQuestion: () => void
  isComplete: boolean
  totalQuestions: number
}

export function useDrill(
  initialQuestions: DrillQuestion[],
  onComplete?: (session: DrillSession) => void
): UseDrillReturn {
  const [questions, setQuestions] = useState<DrillQuestion[]>(initialQuestions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const [lastResponse, setLastResponse] = useState('')
  const [answers, setAnswers] = useState<DrillAnswer[]>([])
  const requeuedIds = useRef<Set<string>>(new Set())
  // eslint-disable-next-line react-hooks/purity
  const questionStartTime = useRef<number>(Date.now())

  const [acceptLatin] = useState(
    () => localStorage.getItem(SETTINGS_KEYS.ACCEPT_LATIN_FALLBACK) !== 'false'
  )

  const currentQuestion = questions[currentIndex] ?? null
  const isComplete = currentIndex >= questions.length

  const session: DrillSession = {
    questions: initialQuestions,
    answers,
    startedAt: useRef(new Date()).current,
    completedAt: isComplete ? new Date() : null,
  }

  // Compute stats
  const stats: DrillStats = computeStats(answers)

  const submitAnswer = useCallback(
    (response: string) => {
      if (!currentQuestion || showFeedback) return

      const timeTakenMs = Date.now() - questionStartTime.current

      // For form_choice, compare directly (not fuzzy)
      const result: AnswerResult = currentQuestion.roundType === 'form_choice'
        ? {
            isCorrect: response === currentQuestion.correctAnswer,
            isAlmostCorrect: false,
            normalizedUser: response,
            normalizedCorrect: currentQuestion.correctAnswer,
          }
        : checkAnswer(
            response,
            currentQuestion.correctAnswer,
            currentQuestion.acceptableAnswers,
            acceptLatin
          )

      const isRetry = requeuedIds.current.has(currentQuestion.id)

      const answer: DrillAnswer = {
        question: currentQuestion,
        userResponse: response,
        result,
        timeTakenMs,
        isRetry,
      }

      setLastResult(result)
      setLastResponse(response)
      setAnswers(prev => [...prev, answer])
      setShowFeedback(true)

      // Adaptive re-queuing: if wrong and not already retried, insert 3-5 positions ahead
      if (!result.isCorrect && !result.isAlmostCorrect && !requeuedIds.current.has(currentQuestion.id)) {
        requeuedIds.current.add(currentQuestion.id)
        const insertAt = Math.min(
          currentIndex + 3 + Math.floor(Math.random() * 3),
          questions.length
        )
        const retryQ: DrillQuestion = { ...currentQuestion, id: `${currentQuestion.id}-retry` }
        setQuestions(prev => {
          const next = [...prev]
          next.splice(insertAt, 0, retryQ)
          return next
        })
      }
    },
    [currentQuestion, showFeedback, acceptLatin, currentIndex, questions.length]
  )

  const nextQuestion = useCallback(() => {
    setShowFeedback(false)
    setLastResult(null)
    setLastResponse('')
    questionStartTime.current = Date.now()

    const nextIdx = currentIndex + 1
    setCurrentIndex(nextIdx)

    if (nextIdx >= questions.length && onComplete) {
      onComplete({
        ...session,
        completedAt: new Date(),
      })
    }
  }, [currentIndex, questions.length, onComplete, session])

  return {
    currentQuestion,
    currentIndex,
    showFeedback,
    lastResult,
    lastResponse,
    stats,
    progress: questions.length > 0 ? currentIndex / questions.length : 0,
    session,
    submitAnswer,
    nextQuestion,
    isComplete,
    totalQuestions: questions.length,
  }
}

function computeStats(answers: DrillAnswer[]): DrillStats {
  const byRoundType = emptyByRoundType()

  let retriesPassed = 0
  let retriesFailed = 0

  for (const a of answers) {
    const rt = a.question.roundType
    byRoundType[rt].total++
    if (a.result.isCorrect) {
      byRoundType[rt].correct++
    }
    if (a.isRetry) {
      if (a.result.isCorrect) retriesPassed++
      else retriesFailed++
    }
  }

  const total = answers.length
  const correct = answers.filter(a => a.result.isCorrect).length
  const almostCorrect = answers.filter(a => a.result.isAlmostCorrect && !a.result.isCorrect).length
  const incorrect = answers.filter(a => !a.result.isCorrect && !a.result.isAlmostCorrect).length

  return {
    total,
    correct,
    almostCorrect,
    incorrect,
    accuracyPercent: total === 0 ? 0 : Math.round((correct / total) * 100),
    retriesPassed,
    retriesFailed,
    byRoundType,
  }
}
