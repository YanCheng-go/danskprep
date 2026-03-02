import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameTimer } from './useGameTimer'

describe('useGameTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with full duration', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useGameTimer({ duration: 30, onTimeUp }))

    expect(result.current.timeLeft).toBe(30)
    expect(result.current.progress).toBe(0)
    expect(result.current.isRunning).toBe(false)
  })

  it('starts counting down', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useGameTimer({ duration: 30, onTimeUp }))

    act(() => {
      result.current.start()
    })

    expect(result.current.isRunning).toBe(true)

    // Advance 10 seconds
    act(() => {
      vi.advanceTimersByTime(10000)
    })

    // timeLeft should be approximately 20
    expect(result.current.timeLeft).toBeCloseTo(20, 0)
    expect(result.current.isRunning).toBe(true)
    expect(onTimeUp).not.toHaveBeenCalled()
  })

  it('calls onTimeUp when timer expires', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useGameTimer({ duration: 5, onTimeUp }))

    act(() => {
      result.current.start()
    })

    // Advance past the 5-second duration
    act(() => {
      vi.advanceTimersByTime(5100)
    })

    expect(result.current.timeLeft).toBe(0)
    expect(result.current.isRunning).toBe(false)
    expect(onTimeUp).toHaveBeenCalledTimes(1)
  })

  it('stops without triggering onTimeUp', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useGameTimer({ duration: 30, onTimeUp }))

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.isRunning).toBe(false)
    expect(onTimeUp).not.toHaveBeenCalled()

    // Advance more time — should not trigger anything
    act(() => {
      vi.advanceTimersByTime(30000)
    })

    expect(onTimeUp).not.toHaveBeenCalled()
  })

  it('resets to full duration', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useGameTimer({ duration: 30, onTimeUp }))

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(15000)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.timeLeft).toBe(30)
    expect(result.current.isRunning).toBe(false)
    expect(result.current.progress).toBe(0)
  })

  it('progress reflects elapsed fraction', () => {
    const onTimeUp = vi.fn()
    const { result } = renderHook(() => useGameTimer({ duration: 10, onTimeUp }))

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // 5 of 10 seconds elapsed → progress ≈ 0.5
    expect(result.current.progress).toBeCloseTo(0.5, 1)
  })
})
