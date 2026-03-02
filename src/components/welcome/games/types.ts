/** Unique identifier for each mini-game */
export type GameId = 'bubbles' | 'gender-snap' | 'cloze-tap' | 'speed-match' | 'word-order'

/** Phase of a timed game session */
export type GamePhase = 'idle' | 'playing' | 'finished'

/** Result returned when a game session ends */
export interface GameResult {
  score: number
  total: number
  accuracy: number
  bestStreak: number
}

export interface GameConfig {
  id: GameId
  /** Translation key for the game title (resolved at render time) */
  titleKey: string
  /** Translation key for the short description */
  descriptionKey: string
  /** Lucide icon name — resolved dynamically in GameSelector */
  icon: string
  /** Game duration in seconds */
  duration: number
  /** Whether the game is implemented and available */
  enabled: boolean
}

export const GAME_CONFIGS: GameConfig[] = [
  {
    id: 'bubbles',
    titleKey: 'game.bubbles.title',
    descriptionKey: 'game.bubbles.description',
    icon: 'Circle',
    duration: 0, // no timer — continuous play
    enabled: true,
  },
  {
    id: 'gender-snap',
    titleKey: 'game.genderSnap.title',
    descriptionKey: 'game.genderSnap.description',
    icon: 'Zap',
    duration: 30,
    enabled: true,
  },
  {
    id: 'cloze-tap',
    titleKey: 'game.clozeTap.title',
    descriptionKey: 'game.clozeTap.description',
    icon: 'MessageSquare',
    duration: 60,
    enabled: false,
  },
  {
    id: 'speed-match',
    titleKey: 'game.speedMatch.title',
    descriptionKey: 'game.speedMatch.description',
    icon: 'Timer',
    duration: 30,
    enabled: false,
  },
  {
    id: 'word-order',
    titleKey: 'game.wordOrder.title',
    descriptionKey: 'game.wordOrder.description',
    icon: 'ArrowUpDown',
    duration: 60,
    enabled: false,
  },
]
