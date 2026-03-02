import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, Trophy, Pencil, Check, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateRandomNickname } from '@/lib/bubble-names'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/hooks/useAuth'
import { SETTINGS_KEYS } from '@/lib/constants'

const NICKNAME_KEY = SETTINGS_KEYS.BUBBLE_NICKNAME
const LOCAL_SCORES_KEY = SETTINGS_KEYS.BUBBLE_SCORES
/** Debounce delay for Supabase sync (ms) */
const SYNC_DELAY = 3000
/** Debounce delay for guest nickname-resume lookup (ms) */
const NICKNAME_RESUME_DELAY = 500

export interface BubbleScore {
  nickname: string
  score: number
  is_guest: boolean
}

/** Read local leaderboard from localStorage */
export function getLocalScores(): BubbleScore[] {
  try {
    const raw = localStorage.getItem(LOCAL_SCORES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as (BubbleScore | { nickname: string; score: number })[]
    return parsed.map(e => ({
      ...e,
      is_guest: 'is_guest' in e ? e.is_guest : true,
    }))
  } catch {
    return []
  }
}

/** Save a score to the local leaderboard (top 10, highest per nickname) */
export function saveLocalScore(nickname: string, score: number, isGuest: boolean): BubbleScore[] {
  const existing = getLocalScores()
  const idx = existing.findIndex(e => e.nickname === nickname)
  if (idx >= 0) {
    if (score > existing[idx].score) {
      existing[idx].score = score
    }
  } else {
    existing.push({ nickname, score, is_guest: isGuest })
  }
  existing.sort((a, b) => b.score - a.score)
  const top10 = existing.slice(0, 10)
  localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(top10))
  return top10
}


interface BubbleLeaderboardProps {
  currentScore: number
  onScoreReset?: () => void
  /** Called when a stored score is loaded (signed-in session restore or guest nickname resume) */
  onScoreLoad?: (score: number) => void
}

export function BubbleLeaderboard({ currentScore, onScoreReset, onScoreLoad }: BubbleLeaderboardProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isGuest = !user

  const [scores, setScores] = useState<BubbleScore[]>(() => getLocalScores())
  const [nickname, setNickname] = useState(() => {
    const stored = localStorage.getItem(NICKNAME_KEY)
    return stored || generateRandomNickname()
  })
  const [editingNickname, setEditingNickname] = useState(false)
  const [synced, setSynced] = useState(false)
  const [dbAvailable, setDbAvailable] = useState(false)

  // Refs to avoid stale closures in debounced sync
  const nicknameRef = useRef(nickname)
  nicknameRef.current = nickname
  const isGuestRef = useRef(isGuest)
  isGuestRef.current = isGuest
  const userRef = useRef(user)
  userRef.current = user
  const dbAvailableRef = useRef(dbAvailable)
  dbAvailableRef.current = dbAvailable
  const onScoreLoadRef = useRef(onScoreLoad)
  onScoreLoadRef.current = onScoreLoad

  // Persist nickname to localStorage whenever it changes
  useEffect(() => {
    if (nickname.trim()) {
      localStorage.setItem(NICKNAME_KEY, nickname.trim())
    }
  }, [nickname])

  // ---- Remote score sync (debounced) ----

  const syncToRemote = useCallback(async (name: string, score: number) => {
    if (!supabase || !dbAvailableRef.current) return
    try {
      if (isGuestRef.current) {
        // Guest: one row per nickname (among guests)
        const { data: existing } = await supabase
          .from('bubble_scores')
          .select('score')
          .eq('nickname', name)
          .eq('is_guest', true)
          .maybeSingle()

        if (existing) {
          if (score > existing.score) {
            await supabase
              .from('bubble_scores')
              .update({ score, updated_at: new Date().toISOString() })
              .eq('nickname', name)
              .eq('is_guest', true)
          }
        } else {
          await supabase
            .from('bubble_scores')
            .insert({ nickname: name, score, is_guest: true, user_id: null })
        }
      } else {
        // Signed-in: one row per (user_id, nickname) pair
        const uid = userRef.current?.id
        if (!uid) return
        const { data: existing } = await supabase
          .from('bubble_scores')
          .select('score')
          .eq('user_id', uid)
          .eq('nickname', name)
          .maybeSingle()

        if (existing) {
          if (score > existing.score) {
            await supabase
              .from('bubble_scores')
              .update({ score, updated_at: new Date().toISOString() })
              .eq('user_id', uid)
              .eq('nickname', name)
          }
        } else {
          await supabase
            .from('bubble_scores')
            .insert({ nickname: name, score, is_guest: false, user_id: uid })
          await supabase
            .from('bubble_nickname_history')
            .insert({ user_id: uid, nickname: name })
        }
      }
      fetchRemoteScores()
    } catch {
      console.warn('Remote score sync failed')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Try to fetch remote scores — merge with local
  const fetchRemoteScores = useCallback(async () => {
    if (!supabase) return
    const { data, error: fetchErr } = await supabase
      .from('bubble_scores')
      .select('nickname, score, is_guest')
      .order('score', { ascending: false })
      .limit(10)
    if (fetchErr) {
      setDbAvailable(false)
      return
    }
    setDbAvailable(true)
    if (data && data.length > 0) {
      const local = getLocalScores()
      const merged = new Map<string, BubbleScore>()
      for (const entry of [...local, ...(data as BubbleScore[])]) {
        const prev = merged.get(entry.nickname)
        if (!prev || entry.score > prev.score) {
          merged.set(entry.nickname, entry)
        }
      }
      const combined = Array.from(merged.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
      setScores(combined)
    }
  }, [])

  useEffect(() => {
    fetchRemoteScores()
  }, [fetchRemoteScores])

  // Ref to track the score at mount time — used to guard auto-restore from
  // clobbering bubbles the user already clicked before the async fetch returns.
  const currentScoreRef = useRef(currentScore)
  currentScoreRef.current = currentScore

  // ---- Signed-in user: restore nickname + score from Supabase ----
  useEffect(() => {
    if (isGuest || !supabase) return
    let cancelled = false
    async function fetchUserSession() {
      try {
        // Fetch the user's most recent entry (by updated_at)
        const { data } = await supabase!
          .from('bubble_scores')
          .select('nickname, score')
          .eq('user_id', user!.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!cancelled && data) {
          if (data.nickname) setNickname(data.nickname)
          // Only auto-restore if user hasn't clicked any bubbles yet
          if (data.score > 0 && currentScoreRef.current === 0) {
            onScoreLoadRef.current?.(data.score)
          }
        }
      } catch {
        // Supabase unavailable — fall back to localStorage (already set in useState init)
      }
    }
    fetchUserSession()
    return () => { cancelled = true }
  }, [isGuest, user])

  // ---- Nickname-resume (typing): check local board + Supabase when nickname changes ----
  // Works for both guests (match by nickname + is_guest) and signed-in users (match by user_id + nickname).
  // No guard here — if the user types a nickname, they want to resume as that player.
  // (The race-condition guard only applies to the signed-in mount fetch above.)
  useEffect(() => {
    const trimmed = nickname.trim()
    if (!trimmed) return

    const timer = setTimeout(() => {
      // Check local board first
      const local = getLocalScores()
      const localMatch = local.find(e => e.nickname === trimmed)
      if (localMatch && localMatch.score > 0) {
        onScoreLoadRef.current?.(localMatch.score)
        return
      }

      // Fallback: check Supabase
      if (supabase && dbAvailableRef.current) {
        const query = isGuestRef.current
          ? supabase
              .from('bubble_scores')
              .select('score')
              .eq('nickname', trimmed)
              .eq('is_guest', true)
              .maybeSingle()
          : userRef.current
            ? supabase
                .from('bubble_scores')
                .select('score')
                .eq('user_id', userRef.current.id)
                .eq('nickname', trimmed)
                .maybeSingle()
            : null

        if (query) {
          query.then(({ data }) => {
            if (data && data.score > 0) {
              onScoreLoadRef.current?.(data.score)
            }
          }, () => {})
        }
      }
    }, NICKNAME_RESUME_DELAY)

    return () => clearTimeout(timer)
  }, [nickname])

  // ---- Auto-save: localStorage immediate + Supabase debounced ----
  useEffect(() => {
    if (currentScore <= 0 || !nicknameRef.current.trim()) return

    // Immediately save locally
    const updated = saveLocalScore(nicknameRef.current.trim(), currentScore, isGuestRef.current)
    setScores(updated)
    setSynced(false)

    // Debounce remote sync
    const timer = setTimeout(() => {
      syncToRemote(nicknameRef.current.trim(), currentScore).then(() => {
        setSynced(true)
      })
    }, SYNC_DELAY)

    return () => clearTimeout(timer)
  }, [currentScore, syncToRemote])

  // Click a leaderboard row to adopt that nickname and resume score
  function handlePickNickname(entry: BubbleScore) {
    const current = nickname.trim()
    // Skip only if same nickname AND score already matches or exceeds
    // (after refresh, nickname matches but score is 0 — still need to resume)
    if (entry.nickname === current && currentScore >= entry.score) return

    // Freeze current score before switching
    if (currentScore > 0) {
      const saved = saveLocalScore(current, currentScore, isGuest)
      setScores(saved)
      syncToRemote(current, currentScore)
    }

    setNickname(entry.nickname)
    setSynced(false)
    // Directly set the picked entry's score (explicit user action — no guard)
    if (entry.score > 0) {
      onScoreLoad?.(entry.score)
    } else {
      onScoreReset?.()
    }
  }

  // Shuffle = freeze old score on board, new nickname starts at 0 (both guest and signed-in)
  function handleShuffleNickname() {
    const oldNickname = nickname.trim()
    const newName = generateRandomNickname()

    // Freeze old score on the board before resetting
    if (currentScore > 0) {
      const saved = saveLocalScore(oldNickname, currentScore, isGuest)
      setScores(saved)
      // Sync old score to Supabase immediately (don't debounce — it's final)
      syncToRemote(oldNickname, currentScore)
    }

    // Record nickname in history for signed-in users
    if (!isGuest && supabase && dbAvailable && user) {
      supabase
        .from('bubble_nickname_history')
        .insert({ user_id: user.id, nickname: newName })
        .then(() => {}, () => {})
    }

    // Switch to new nickname and reset score
    setNickname(newName)
    setSynced(false)
    onScoreReset?.()
  }

  return (
    <div className="w-full space-y-5">
      {/* Nickname section */}
      <div className="rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] p-4">
        <label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2 block">
          {t('bubble.ranking.yourNickname')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value)
              setEditingNickname(true)
              setSynced(false)
            }}
            onBlur={() => setEditingNickname(false)}
            maxLength={30}
            placeholder={t('bubble.leaderboard.nickname')}
            className="flex-1 min-w-0 rounded-md border border-foreground/[0.12] bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <button
            type="button"
            onClick={handleShuffleNickname}
            title={isGuest ? t('bubble.leaderboard.shuffleGuest') : t('bubble.leaderboard.shuffle')}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-md border border-foreground/[0.12] bg-background hover:bg-foreground/[0.05] transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        {editingNickname && (
          <p className="text-[11px] text-muted-foreground/50 mt-1.5 flex items-center gap-1">
            <Pencil className="h-3 w-3" />
            {t('bubble.ranking.nicknameSaved')}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground/50">
          <User className="h-3 w-3" />
          {isGuest ? t('bubble.ranking.guestMode') : t('bubble.ranking.signedInMode')}
        </div>
      </div>

      {/* Current score + sync status */}
      {currentScore > 0 && (
        <div className="rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium">
            {t('bubble.leaderboard.yourScore', { count: String(currentScore) })}
          </p>
          {synced ? (
            <span className="text-[11px] text-green-500 flex items-center gap-1">
              <Check className="h-3 w-3" />
              {t('bubble.leaderboard.synced')}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/50">
              {t('bubble.leaderboard.syncing')}
            </span>
          )}
        </div>
      )}

      {/* Rankings table */}
      <div className="rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-semibold">{t('bubble.leaderboard.title')}</h3>
        </div>

        {scores.length > 0 ? (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                  <th className="text-left pb-2 w-8">{t('bubble.leaderboard.rank')}</th>
                  <th className="text-left pb-2">{t('bubble.leaderboard.player')}</th>
                  <th className="text-right pb-2">{t('bubble.leaderboard.score')}</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((entry, i) => {
                  const isYou = entry.nickname === nickname.trim()
                  return (
                    <tr
                      key={entry.nickname}
                      role="button"
                      tabIndex={0}
                      onClick={() => handlePickNickname(entry)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePickNickname(entry) }}
                      className={`border-t border-foreground/[0.05] cursor-pointer transition-colors hover:bg-foreground/[0.06] ${isYou ? 'bg-primary/[0.06]' : ''}`}
                    >
                      <td className="py-1.5 text-muted-foreground/70">{i + 1}</td>
                      <td className="py-1.5 font-medium truncate max-w-[160px]">
                        {entry.nickname}
                        {isYou && <span className="text-[10px] text-primary ml-1.5 font-normal">(you)</span>}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{entry.score}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="text-[11px] text-muted-foreground/40 mt-2">{t('bubble.leaderboard.clickToResume')}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground/60">{t('bubble.leaderboard.empty')}</p>
        )}
      </div>

      {currentScore <= 0 && (
        <p className="text-xs text-muted-foreground/50 text-center">
          {t('bubble.ranking.playToScore')}
        </p>
      )}
    </div>
  )
}
