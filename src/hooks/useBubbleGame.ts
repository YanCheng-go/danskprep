import { useState, useEffect, useRef, useCallback } from 'react'
import { SETTINGS_KEYS } from '@/lib/constants'

interface UseBubbleGameOptions {
  initialEnabled?: boolean
}

interface UseBubbleGameReturn {
  bubbleScore: number
  setBubbleScore: (score: number | ((prev: number) => number)) => void
  gamePanelOpen: boolean
  setGamePanelOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  bubblesEnabled: boolean
  toggleBubbles: () => void
}

/**
 * Migrate old localStorage keys (without prefix) to the new prefixed keys.
 * Runs once per session — safe to call multiple times.
 */
function migrateLocalStorageKeys() {
  const migrations: [string, string][] = [
    ['bubble_nickname', SETTINGS_KEYS.BUBBLE_NICKNAME],
    ['bubble_scores', SETTINGS_KEYS.BUBBLE_SCORES],
  ]
  for (const [oldKey, newKey] of migrations) {
    if (oldKey === newKey) continue
    const value = localStorage.getItem(oldKey)
    if (value !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, value)
      localStorage.removeItem(oldKey)
    }
  }
}

export function useBubbleGame({ initialEnabled = false }: UseBubbleGameOptions = {}): UseBubbleGameReturn {
  const [bubbleScore, setBubbleScore] = useState(0)
  const [gamePanelOpen, setGamePanelOpen] = useState(false)
  const [bubblesEnabled, setBubblesEnabled] = useState(initialEnabled)

  // Migrate old localStorage keys on first mount
  useEffect(() => {
    migrateLocalStorageKeys()
  }, [])

  // Auto-open game panel on first bubble discovery
  const hasOpenedRef = useRef(false)
  useEffect(() => {
    if (bubbleScore === 1 && !hasOpenedRef.current) {
      hasOpenedRef.current = true
      setGamePanelOpen(true)
    }
  }, [bubbleScore])

  const toggleBubbles = useCallback(() => {
    setBubblesEnabled(prev => !prev)
  }, [])

  return {
    bubbleScore,
    setBubbleScore,
    gamePanelOpen,
    setGamePanelOpen,
    bubblesEnabled,
    toggleBubbles,
  }
}
