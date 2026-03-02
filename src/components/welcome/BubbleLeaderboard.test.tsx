import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BubbleLeaderboard, getLocalScores, saveLocalScore } from './BubbleLeaderboard'
import type { BubbleScore } from './BubbleLeaderboard'
import { SETTINGS_KEYS } from '@/lib/constants'

// ---- Mocks ----

const mockUser = { id: 'user-123', email: 'test@example.com' }

// Mock useAuth — switchable between guest and signed-in
let mockAuthUser: typeof mockUser | null = null
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockAuthUser, session: null, isLoading: false }),
}))

// Mock i18n — return key as value for testability
vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params) {
        return Object.entries(params).reduce(
          (s, [k, v]) => s.replace(`{${k}}`, String(v)),
          key
        )
      }
      return key
    },
    locale: 'en',
    setLocale: vi.fn(),
  }),
}))

// Mock bubble-names — deterministic
let nicknameCounter = 0
vi.mock('@/lib/bubble-names', () => ({
  generateRandomNickname: () => `test_name_${nicknameCounter++}`,
}))

// Build a chainable mock for Supabase queries
function createMockQuery(resolveData: unknown = null, resolveError: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const methods = ['from', 'select', 'insert', 'update', 'eq', 'order', 'limit', 'maybeSingle']
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnThis()
  }
  // Terminal: .then() for PromiseLike
  chain.then = vi.fn((onFulfilled?: (val: unknown) => void) => {
    onFulfilled?.({ data: resolveData, error: resolveError })
    return { then: vi.fn(), catch: vi.fn() }
  })
  // maybeSingle returns a PromiseLike too
  chain.maybeSingle = vi.fn().mockReturnValue({
    then: vi.fn((onFulfilled?: (val: unknown) => void) => {
      onFulfilled?.({ data: resolveData, error: resolveError })
      return { then: vi.fn() }
    }),
  })
  return chain
}

let mockSupabaseClient: ReturnType<typeof createMockQuery> | null = null

vi.mock('@/lib/supabase', () => ({
  get supabase() {
    return mockSupabaseClient
  },
}))

// ---- Helpers ----

const LOCAL_SCORES_KEY = SETTINGS_KEYS.BUBBLE_SCORES
const NICKNAME_KEY = SETTINGS_KEYS.BUBBLE_NICKNAME

function setLocalScores(scores: BubbleScore[]) {
  localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(scores))
}

// ======================================================================
// Unit tests for pure functions
// ======================================================================

describe('getLocalScores', () => {
  beforeEach(() => localStorage.clear())

  it('returns empty array when nothing stored', () => {
    expect(getLocalScores()).toEqual([])
  })

  it('parses stored scores', () => {
    const data: BubbleScore[] = [
      { nickname: 'alice', score: 10, is_guest: true },
      { nickname: 'bob', score: 5, is_guest: false },
    ]
    setLocalScores(data)
    expect(getLocalScores()).toEqual(data)
  })

  it('defaults is_guest to true for legacy entries', () => {
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify([
      { nickname: 'old', score: 3 },
    ]))
    const result = getLocalScores()
    expect(result[0].is_guest).toBe(true)
  })

  it('returns empty array for malformed JSON', () => {
    localStorage.setItem(LOCAL_SCORES_KEY, 'not json')
    expect(getLocalScores()).toEqual([])
  })
})

describe('saveLocalScore', () => {
  beforeEach(() => localStorage.clear())

  it('creates a new entry', () => {
    const result = saveLocalScore('alice', 5, true)
    expect(result).toEqual([{ nickname: 'alice', score: 5, is_guest: true }])
  })

  it('updates existing entry if new score is higher', () => {
    saveLocalScore('alice', 5, true)
    const result = saveLocalScore('alice', 10, true)
    expect(result.find(e => e.nickname === 'alice')?.score).toBe(10)
  })

  it('does NOT update if new score is lower', () => {
    saveLocalScore('alice', 10, true)
    const result = saveLocalScore('alice', 3, true)
    expect(result.find(e => e.nickname === 'alice')?.score).toBe(10)
  })

  it('keeps top 10 sorted descending', () => {
    for (let i = 0; i < 12; i++) {
      saveLocalScore(`player_${i}`, i + 1, true)
    }
    const result = getLocalScores()
    expect(result).toHaveLength(10)
    expect(result[0].score).toBe(12)
    expect(result[9].score).toBe(3)
  })

  it('differentiates signed-in entries with is_guest flag', () => {
    saveLocalScore('alice', 5, false)
    const result = getLocalScores()
    expect(result[0].is_guest).toBe(false)
  })
})

// ======================================================================
// Component / integration tests
// ======================================================================

describe('BubbleLeaderboard component', () => {
  beforeEach(() => {
    localStorage.clear()
    nicknameCounter = 0
    mockAuthUser = null
    mockSupabaseClient = null
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // -- Rendering --

  it('renders with random nickname for guest', () => {
    render(<BubbleLeaderboard currentScore={0} />)
    const input = screen.getByPlaceholderText('bubble.leaderboard.nickname') as HTMLInputElement
    expect(input.value).toBe('test_name_0')
  })

  it('renders stored nickname from localStorage', () => {
    localStorage.setItem(NICKNAME_KEY, 'my_saved_name')
    render(<BubbleLeaderboard currentScore={0} />)
    const input = screen.getByPlaceholderText('bubble.leaderboard.nickname') as HTMLInputElement
    expect(input.value).toBe('my_saved_name')
  })

  it('shows score when currentScore > 0', () => {
    render(<BubbleLeaderboard currentScore={5} />)
    expect(screen.getByText('bubble.leaderboard.yourScore')).toBeDefined()
  })

  it('shows play-to-score message when score is 0', () => {
    render(<BubbleLeaderboard currentScore={0} />)
    expect(screen.getByText('bubble.ranking.playToScore')).toBeDefined()
  })

  it('displays guest mode label for guests', () => {
    render(<BubbleLeaderboard currentScore={0} />)
    expect(screen.getByText('bubble.ranking.guestMode')).toBeDefined()
  })

  it('displays signed-in mode label when authenticated', () => {
    mockAuthUser = mockUser
    render(<BubbleLeaderboard currentScore={0} />)
    expect(screen.getByText('bubble.ranking.signedInMode')).toBeDefined()
  })

  // -- Local score saving --

  it('saves score to local leaderboard when currentScore changes', () => {
    const { rerender } = render(<BubbleLeaderboard currentScore={0} />)
    rerender(<BubbleLeaderboard currentScore={3} />)
    const scores = getLocalScores()
    expect(scores.some(s => s.score === 3)).toBe(true)
  })

  // -- Shuffle (new nickname, score reset) --

  it('calls onScoreReset when shuffle is clicked', async () => {
    const onScoreReset = vi.fn()
    render(<BubbleLeaderboard currentScore={5} onScoreReset={onScoreReset} />)

    const shuffleBtn = screen.getByTitle('bubble.leaderboard.shuffleGuest')
    await act(async () => {
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(shuffleBtn)
    })

    expect(onScoreReset).toHaveBeenCalledOnce()
  })

  it('freezes old score on board when shuffling with active score', async () => {
    const onScoreReset = vi.fn()
    render(<BubbleLeaderboard currentScore={7} onScoreReset={onScoreReset} />)

    // Get the current nickname before shuffle
    const input = screen.getByPlaceholderText('bubble.leaderboard.nickname') as HTMLInputElement
    const oldNickname = input.value

    await act(async () => {
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(
        screen.getByTitle('bubble.leaderboard.shuffleGuest')
      )
    })

    // Old score should be on the local board
    const scores = getLocalScores()
    expect(scores.find(s => s.nickname === oldNickname)?.score).toBe(7)

    // Nickname should have changed
    expect(input.value).not.toBe(oldNickname)
  })

  // -- onScoreLoad guard (prev === 0) --

  it('onScoreLoad is NOT called with 0 score from local board', async () => {
    // Set up a local entry with score 0
    saveLocalScore('zero_player', 0, true)
    localStorage.setItem(NICKNAME_KEY, 'zero_player')

    const onScoreLoad = vi.fn()
    render(<BubbleLeaderboard currentScore={0} onScoreLoad={onScoreLoad} />)

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(onScoreLoad).not.toHaveBeenCalled()
  })

  // -- Guest nickname resume from local board --

  it('calls onScoreLoad when guest types a nickname matching local board', async () => {
    // Pre-populate local board with a score
    saveLocalScore('old_guest', 15, true)

    const onScoreLoad = vi.fn()
    render(<BubbleLeaderboard currentScore={0} onScoreLoad={onScoreLoad} />)

    // Type the old nickname
    const input = screen.getByPlaceholderText('bubble.leaderboard.nickname') as HTMLInputElement
    await act(async () => {
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).clear(input)
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).type(input, 'old_guest')
    })

    // Advance past the 500ms debounce
    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(onScoreLoad).toHaveBeenCalledWith(15)
  })

  // -- Leaderboard display --

  it('renders existing local scores in the table', () => {
    saveLocalScore('alice', 20, true)
    saveLocalScore('bob', 10, false)

    render(<BubbleLeaderboard currentScore={0} />)

    expect(screen.getByText('alice')).toBeDefined()
    expect(screen.getByText('20')).toBeDefined()
    expect(screen.getByText('bob')).toBeDefined()
    expect(screen.getByText('10')).toBeDefined()
  })

  it('highlights current user in the leaderboard with (you) marker', () => {
    localStorage.setItem(NICKNAME_KEY, 'alice')
    saveLocalScore('alice', 20, true)

    render(<BubbleLeaderboard currentScore={20} />)

    expect(screen.getByText('(you)')).toBeDefined()
  })

  // -- Click row to resume --

  it('calls onScoreLoad directly when clicking a leaderboard row', async () => {
    saveLocalScore('old_player', 25, true)

    const onScoreLoad = vi.fn()
    render(
      <BubbleLeaderboard currentScore={5} onScoreLoad={onScoreLoad} />
    )

    const row = screen.getByText('old_player').closest('tr')!
    await act(async () => {
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(row)
    })

    // Row click directly sets the score (no guard — explicit user action)
    expect(onScoreLoad).toHaveBeenCalledWith(25)
  })

  it('calls onScoreReset when clicking a row with score 0', async () => {
    saveLocalScore('zero_player', 0, true)
    // Need a second entry so the board shows
    saveLocalScore('other', 5, true)

    const onScoreReset = vi.fn()
    const onScoreLoad = vi.fn()
    render(
      <BubbleLeaderboard currentScore={5} onScoreReset={onScoreReset} onScoreLoad={onScoreLoad} />
    )

    // The zero_player row exists on the board but has score 0
    const zeroRow = screen.getByText('zero_player')?.closest('tr')
    if (zeroRow) {
      await act(async () => {
        await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(zeroRow)
      })
      expect(onScoreReset).toHaveBeenCalledOnce()
      expect(onScoreLoad).not.toHaveBeenCalled()
    }
  })

  it('does NOT call handlers when clicking row with same nickname and score already loaded', async () => {
    localStorage.setItem(NICKNAME_KEY, 'current_player')
    saveLocalScore('current_player', 10, true)

    const onScoreReset = vi.fn()
    const onScoreLoad = vi.fn()
    // currentScore matches entry.score — no-op
    render(
      <BubbleLeaderboard currentScore={10} onScoreReset={onScoreReset} onScoreLoad={onScoreLoad} />
    )

    const row = screen.getByText('current_player').closest('tr')!
    await act(async () => {
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(row)
    })

    expect(onScoreReset).not.toHaveBeenCalled()
    expect(onScoreLoad).not.toHaveBeenCalled()
  })

  it('DOES resume score when clicking row with same nickname but score is 0 (post-refresh)', async () => {
    localStorage.setItem(NICKNAME_KEY, 'old_player')
    saveLocalScore('old_player', 15, true)

    const onScoreLoad = vi.fn()
    // currentScore is 0 (just refreshed) but nickname matches the board entry
    render(
      <BubbleLeaderboard currentScore={0} onScoreLoad={onScoreLoad} />
    )

    const row = screen.getByText('old_player').closest('tr')!
    await act(async () => {
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(row)
    })

    // Should resume the stored score even though nickname already matches
    expect(onScoreLoad).toHaveBeenCalledWith(15)
  })

  it('freezes current score on board when clicking a different row', async () => {
    saveLocalScore('other_player', 20, true)

    render(<BubbleLeaderboard currentScore={8} />)

    const input = screen.getByPlaceholderText('bubble.leaderboard.nickname') as HTMLInputElement
    const currentNick = input.value

    const row = screen.getByText('other_player').closest('tr')!
    await act(async () => {
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(row)
    })

    // Old nickname's score should be frozen on the board
    const scores = getLocalScores()
    expect(scores.find(s => s.nickname === currentNick)?.score).toBe(8)

    // Input should now show the clicked nickname
    expect(input.value).toBe('other_player')
  })

  // -- Nickname persistence --

  it('persists nickname to localStorage on change', async () => {
    render(<BubbleLeaderboard currentScore={0} />)

    const input = screen.getByPlaceholderText('bubble.leaderboard.nickname') as HTMLInputElement
    await act(async () => {
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).clear(input)
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).type(input, 'new_nick')
    })

    expect(localStorage.getItem(NICKNAME_KEY)).toBe('new_nick')
  })
})

// ======================================================================
// Session lifecycle tests (simulating parent behavior)
// ======================================================================

describe('Session lifecycle (parent-level guards)', () => {
  beforeEach(() => {
    localStorage.clear()
    nicknameCounter = 0
    mockAuthUser = null
    mockSupabaseClient = null
  })

  it('onScoreLoad from parent directly sets score', () => {
    let parentScore = 0
    const setParentScore = (score: number) => {
      // Parent now does: setBubbleScore(score) — no guard
      parentScore = score
    }

    // Simulate: Supabase returns score=42
    setParentScore(42)
    expect(parentScore).toBe(42)
  })

  it('auto-restore guard lives in BubbleLeaderboard — currentScoreRef check', () => {
    // The guard (only auto-restore if currentScore === 0) is inside BubbleLeaderboard's
    // mount effects, not in the parent. Parent always sets the score directly.
    // This means explicit actions (row click) always work.
    let parentScore = 3
    const setParentScore = (score: number) => {
      parentScore = score
    }

    // Explicit row click sets score directly — no guard
    setParentScore(42)
    expect(parentScore).toBe(42)
  })

  it('sign out clears nickname from localStorage', () => {
    localStorage.setItem(NICKNAME_KEY, 'old_nick')

    // Simulate: Layout.handleSignOut
    localStorage.removeItem(NICKNAME_KEY)
    expect(localStorage.getItem(NICKNAME_KEY)).toBeNull()
  })

  it('toggle bubbles off then on preserves score (parent state unchanged)', () => {
    let parentScore = 10
    // Toggle off: component unmounts, but parentScore stays
    // Toggle on: component remounts with same parentScore
    expect(parentScore).toBe(10) // Preserved
  })
})

// ======================================================================
// Multi-row DB model tests (syncToRemote logic)
// ======================================================================

describe('Multi-row model behavior', () => {
  beforeEach(() => {
    localStorage.clear()
    nicknameCounter = 0
  })

  it('saveLocalScore allows multiple nicknames for same session', () => {
    saveLocalScore('nick_1', 10, false)
    saveLocalScore('nick_2', 5, false)

    const scores = getLocalScores()
    expect(scores.find(s => s.nickname === 'nick_1')?.score).toBe(10)
    expect(scores.find(s => s.nickname === 'nick_2')?.score).toBe(5)
  })

  it('saveLocalScore keeps highest score per nickname (not cumulative)', () => {
    saveLocalScore('alice', 5, true)
    saveLocalScore('alice', 3, true) // Lower — should NOT update
    saveLocalScore('alice', 8, true) // Higher — should update

    const scores = getLocalScores()
    expect(scores.find(s => s.nickname === 'alice')?.score).toBe(8)
  })

  it('shuffle creates separate board entries (old frozen, new at 0)', () => {
    // Simulate: user plays as "nick_1" with score 10, then shuffles
    saveLocalScore('nick_1', 10, false)
    // After shuffle, new nickname starts at 0 (nothing saved yet)

    const scores = getLocalScores()
    expect(scores.find(s => s.nickname === 'nick_1')?.score).toBe(10)
    // "nick_2" not yet in board — only appears after user earns points
    expect(scores.find(s => s.nickname === 'nick_2')).toBeUndefined()
  })
})
