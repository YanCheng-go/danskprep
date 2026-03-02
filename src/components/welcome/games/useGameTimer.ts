import { useState, useRef, useCallback, useEffect } from 'react'

interface UseGameTimerOptions {
  /** Total duration in seconds */
  duration: number
  /** Called when timer reaches zero */
  onTimeUp: () => void
}

interface UseGameTimerReturn {
  /** Seconds remaining (integer) */
  timeLeft: number
  /** 0–1 fraction of time elapsed */
  progress: number
  /** Whether the timer is actively counting */
  isRunning: boolean
  /** Start the countdown */
  start: () => void
  /** Stop the countdown without triggering onTimeUp */
  stop: () => void
  /** Reset to full duration */
  reset: () => void
}

/**
 * Drift-safe countdown timer using Date.now() instead of setInterval accumulation.
 * Ticks every 100ms for smooth progress bar updates.
 */
export function useGameTimer({ duration, onTimeUp }: UseGameTimerOptions): UseGameTimerReturn {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)
  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTimeUpRef = useRef(onTimeUp)

  // Keep callback ref fresh without re-triggering effects
  onTimeUpRef.current = onTimeUp

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    clearTimer()
    startTimeRef.current = Date.now()
    setTimeLeft(duration)
    setIsRunning(true)

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const remaining = Math.max(0, duration - elapsed)
      setTimeLeft(remaining)

      if (remaining <= 0) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setIsRunning(false)
        onTimeUpRef.current()
      }
    }, 100)
  }, [duration, clearTimer])

  const stop = useCallback(() => {
    clearTimer()
    setIsRunning(false)
  }, [clearTimer])

  const reset = useCallback(() => {
    clearTimer()
    setTimeLeft(duration)
    setIsRunning(false)
  }, [duration, clearTimer])

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer
  }, [clearTimer])

  const progress = 1 - timeLeft / duration

  return { timeLeft, progress, isRunning, start, stop, reset }
}
