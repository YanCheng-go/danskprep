import { useCallback, useRef, useState } from 'react'
import { checkAnswer } from '@/lib/answer-check'
import type { Exercise, QuizAnswer, QuizSession, QuizStats, AnswerResult } from '@/types/quiz'
import { SETTINGS_KEYS } from '@/lib/constants'

interface UseQuizReturn {
  currentExercise: Exercise | null
  currentIndex: number
  showFeedback: boolean
  lastResult: AnswerResult | null
  lastResponse: string
  stats: QuizStats
  progress: number  // 0–1
  session: QuizSession
  submitAnswer: (response: string) => void
  nextQuestion: () => void
  isComplete: boolean
}

export function useQuiz(
  exercises: Exercise[],
  onComplete?: (session: QuizSession) => void
): UseQuizReturn {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const [lastResponse, setLastResponse] = useState('')
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const questionStartTime = useRef(Date.now())

  const acceptLatin = localStorage.getItem(SETTINGS_KEYS.ACCEPT_LATIN_FALLBACK) !== 'false'

  const currentExercise = exercises[currentIndex] ?? null
  const isComplete = currentIndex >= exercises.length

  const session: QuizSession = {
    exercises,
    answers,
    startedAt: useRef(new Date()).current,
    completedAt: isComplete ? new Date() : null,
  }

  const stats: QuizStats = {
    total: answers.length,
    correct: answers.filter(a => a.result.isCorrect).length,
    almostCorrect: answers.filter(a => a.result.isAlmostCorrect && !a.result.isCorrect).length,
    incorrect: answers.filter(a => !a.result.isCorrect && !a.result.isAlmostCorrect).length,
    accuracyPercent:
      answers.length === 0
        ? 0
        : Math.round(
            (answers.filter(a => a.result.isCorrect).length / answers.length) * 100
          ),
  }

  const submitAnswer = useCallback(
    (response: string) => {
      if (!currentExercise || showFeedback) return

      const timeTakenMs = Date.now() - questionStartTime.current
      const result = checkAnswer(
        response,
        currentExercise.correct_answer,
        currentExercise.acceptable_answers,
        acceptLatin
      )

      const answer: QuizAnswer = {
        exercise: currentExercise,
        userResponse: response,
        result,
        timeTakenMs,
      }

      setLastResult(result)
      setLastResponse(response)
      setAnswers(prev => [...prev, answer])
      setShowFeedback(true)
    },
    [currentExercise, showFeedback, acceptLatin]
  )

  const nextQuestion = useCallback(() => {
    setShowFeedback(false)
    setLastResult(null)
    setLastResponse('')
    questionStartTime.current = Date.now()

    const nextIndex = currentIndex + 1
    setCurrentIndex(nextIndex)

    if (nextIndex >= exercises.length && onComplete) {
      onComplete({
        ...session,
        completedAt: new Date(),
      })
    }
  }, [currentIndex, exercises.length, onComplete, session])

  return {
    currentExercise,
    currentIndex,
    showFeedback,
    lastResult,
    lastResponse,
    stats,
    progress: exercises.length > 0 ? currentIndex / exercises.length : 0,
    session,
    submitAnswer,
    nextQuestion,
    isComplete,
  }
}
