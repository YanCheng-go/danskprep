import type { Word } from '@/types/database'
import type { DrillQuestion, DrillConfig, DrillRoundType } from '@/types/drill'

// ─── Inflection label maps ─────────────────────────────────────────────────

const VERB_LABELS: Record<string, string> = {
  present: 'Nutid',
  past: 'Datid',
  perfect: 'Perfektum',
  imperative: 'Bydeform',
}

const NOUN_LABELS: Record<string, string> = {
  definite: 'Bestemt',
  plural_indef: 'Flertal ubest.',
  plural_def: 'Flertal best.',
}

const ADJECTIVE_LABELS: Record<string, string> = {
  t_form: 'T-form',
  e_form: 'E-form',
  comparative: 'Komparativ',
  superlative: 'Superlativ',
}

export function getInflectionLabels(pos: string): Record<string, string> {
  switch (pos) {
    case 'verb': return VERB_LABELS
    case 'noun': return NOUN_LABELS
    case 'adjective': return ADJECTIVE_LABELS
    default: return {}
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let idCounter = 0

function nextId(): string {
  return `drill-${++idCounter}`
}

/** Reset the ID counter (for testing). */
export function resetIdCounter(): void {
  idCounter = 0
}

/** Get string inflection entries (skip arrays like pronoun possessive). */
function getStringInflections(word: Word): [string, string][] {
  if (!word.inflections) return []
  return Object.entries(word.inflections).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== ''
  )
}

/** Fisher-Yates shuffle. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Generator 1: Translation EN → DA ──────────────────────────────────────

export function generateTranslationEnDa(word: Word): DrillQuestion {
  const acceptable: string[] = []

  // For nouns, accept with or without article
  if (word.part_of_speech === 'noun' && word.gender) {
    acceptable.push(`${word.gender} ${word.danish}`)
    acceptable.push(word.danish)
  }

  // For verbs, accept with or without "at"
  if (word.part_of_speech === 'verb') {
    acceptable.push(`at ${word.danish}`)
    acceptable.push(word.danish)
  }

  return {
    id: nextId(),
    word,
    roundType: 'translation_en_da',
    prompt: `Translate to Danish: ${word.english}`,
    correctAnswer: word.danish,
    acceptableAnswers: acceptable,
    hint: word.part_of_speech === 'noun' && word.gender ? `(${word.gender}-ord)` : undefined,
    explanation: word.example_da && word.example_en
      ? `${word.example_da} — ${word.example_en}`
      : undefined,
  }
}

// ─── Generator 2: Translation DA → EN ──────────────────────────────────────

export function generateTranslationDaEn(word: Word): DrillQuestion {
  const displayDanish = word.part_of_speech === 'noun' && word.gender
    ? `${word.gender} ${word.danish}`
    : word.part_of_speech === 'verb'
    ? `at ${word.danish}`
    : word.danish

  // Accept English with/without "to" prefix for verbs
  const acceptable: string[] = []
  if (word.part_of_speech === 'verb') {
    acceptable.push(word.english)
    if (word.english.startsWith('to ')) {
      acceptable.push(word.english.slice(3))
    } else {
      acceptable.push(`to ${word.english}`)
    }
  }

  return {
    id: nextId(),
    word,
    roundType: 'translation_da_en',
    prompt: `What does '${displayDanish}' mean?`,
    correctAnswer: word.english,
    acceptableAnswers: acceptable,
    explanation: word.example_da && word.example_en
      ? `${word.example_da} — ${word.example_en}`
      : undefined,
  }
}

// ─── Generator 3: Context Cloze ─────────────────────────────────────────────

export function generateContextCloze(word: Word): DrillQuestion | null {
  if (!word.example_da) return null

  const sentence = word.example_da
  const forms = [word.danish, ...getStringInflections(word).map(([, v]) => v)]
  // Sort longest first so we match e.g. "spiser" before "spis"
  const sortedForms = [...new Set(forms)].sort((a, b) => b.length - a.length)

  let matchedForm: string | null = null
  let cloze = sentence

  for (const form of sortedForms) {
    // Case-insensitive match in sentence
    const regex = new RegExp(`\\b${escapeRegex(form)}\\b`, 'i')
    if (regex.test(sentence)) {
      matchedForm = form
      cloze = sentence.replace(regex, '___')
      break
    }
  }

  if (!matchedForm) return null

  // Accept the base form too if the matched form is inflected
  const acceptable = [matchedForm]
  if (matchedForm !== word.danish) {
    // Don't add the base form as acceptable — for cloze, the exact form matters
  }

  return {
    id: nextId(),
    word,
    roundType: 'context_cloze',
    prompt: cloze,
    correctAnswer: matchedForm,
    acceptableAnswers: acceptable,
    hint: word.example_en ?? word.english,
    explanation: `${word.danish} — ${word.english}`,
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ─── Generator 4: Paradigm Fill ─────────────────────────────────────────────

export function generateParadigmFill(word: Word): DrillQuestion | null {
  const entries = getStringInflections(word)
  if (entries.length < 2) return null

  const labels = getInflectionLabels(word.part_of_speech)
  const randomIdx = Math.floor(Math.random() * entries.length)
  const [testedKey, testedValue] = entries[randomIdx]

  // Build paradigm context (all entries except the tested one)
  const paradigmContext: Record<string, string> = {}
  for (const [key, value] of entries) {
    if (key !== testedKey) {
      paradigmContext[labels[key] ?? key] = value
    }
  }

  // Build prompt as table representation
  const label = labels[testedKey] ?? testedKey
  const contextLines = entries.map(([key, value]) => {
    const l = labels[key] ?? key
    return key === testedKey ? `${l}: ___` : `${l}: ${value}`
  })

  const wordHeader = word.part_of_speech === 'noun' && word.gender
    ? `${word.gender} ${word.danish} (${word.english})`
    : word.part_of_speech === 'verb'
    ? `at ${word.danish} (${word.english})`
    : `${word.danish} (${word.english})`

  return {
    id: nextId(),
    word,
    roundType: 'paradigm_fill',
    prompt: `${wordHeader}\n${contextLines.join(', ')}`,
    correctAnswer: testedValue,
    acceptableAnswers: [testedValue],
    inflectionKey: testedKey,
    paradigmContext,
    hint: `Fill in the ${label} form`,
    explanation: `${label} of '${word.danish}' is '${testedValue}'`,
  }
}

// ─── Generator 5: Form Choice ───────────────────────────────────────────────

export function generateFormChoice(word: Word): DrillQuestion | null {
  const entries = getStringInflections(word)
  if (entries.length < 2) return null

  const labels = getInflectionLabels(word.part_of_speech)
  const randomIdx = Math.floor(Math.random() * entries.length)
  const [testedKey, correctValue] = entries[randomIdx]
  const label = labels[testedKey] ?? testedKey

  // Build distractors from other forms of the same word
  const distractors = entries
    .filter(([key]) => key !== testedKey)
    .map(([, value]) => value)

  // Pick 1-2 distractors
  const shuffledDistractors = shuffle(distractors).slice(0, 2)
  const alternatives = shuffle([correctValue, ...shuffledDistractors])

  const wordDisplay = word.part_of_speech === 'noun' && word.gender
    ? `${word.gender} ${word.danish}`
    : word.part_of_speech === 'verb'
    ? `at ${word.danish}`
    : word.danish

  return {
    id: nextId(),
    word,
    roundType: 'form_choice',
    prompt: `Which is the ${label} form of '${wordDisplay}'?`,
    correctAnswer: correctValue,
    acceptableAnswers: [correctValue],
    alternatives,
    explanation: `${label} of '${word.danish}' is '${correctValue}'`,
  }
}

// ─── Session Assembly ───────────────────────────────────────────────────────

const ALL_ROUND_TYPES: DrillRoundType[] = [
  'translation_en_da',
  'translation_da_en',
  'context_cloze',
  'paradigm_fill',
  'form_choice',
]

const DRILLABLE_POS = ['noun', 'verb', 'adjective'] as const

type GeneratorFn = (word: Word) => DrillQuestion | null

function getGenerator(roundType: DrillRoundType): GeneratorFn {
  switch (roundType) {
    case 'translation_en_da': return generateTranslationEnDa
    case 'translation_da_en': return generateTranslationDaEn
    case 'context_cloze': return generateContextCloze
    case 'paradigm_fill': return generateParadigmFill
    case 'form_choice': return generateFormChoice
  }
}

export function buildDrillSession(
  words: Word[],
  config: DrillConfig
): DrillQuestion[] {
  resetIdCounter()

  // Filter by POS
  const posFilter = config.posFilter.length > 0
    ? config.posFilter
    : DRILLABLE_POS
  const filtered = words.filter(w =>
    (posFilter as readonly string[]).includes(w.part_of_speech)
  )

  if (filtered.length === 0) return []

  const roundTypes = config.roundTypes.length > 0
    ? config.roundTypes
    : ALL_ROUND_TYPES

  // Generate candidate questions via round-robin over round types
  const candidates: DrillQuestion[] = []
  const shuffledWords = shuffle(filtered)
  let wordIdx = 0

  // Keep generating until we have enough or exhaust attempts
  const maxAttempts = config.questionCount * 5
  let attempts = 0

  while (candidates.length < config.questionCount && attempts < maxAttempts) {
    for (const roundType of roundTypes) {
      if (candidates.length >= config.questionCount) break
      attempts++

      const word = shuffledWords[wordIdx % shuffledWords.length]
      wordIdx++

      const generator = getGenerator(roundType)
      const question = generator(word)
      if (question) {
        candidates.push(question)
      }
    }
  }

  // If paradigm/form_choice pools are too small, backfill with translation rounds
  if (candidates.length < config.questionCount) {
    const backfillTypes: DrillRoundType[] = ['translation_en_da', 'translation_da_en']
    while (candidates.length < config.questionCount) {
      const word = shuffledWords[wordIdx % shuffledWords.length]
      wordIdx++
      const roundType = backfillTypes[candidates.length % backfillTypes.length]
      const question = getGenerator(roundType)(word)
      if (question) candidates.push(question)
    }
  }

  // Constrained shuffle: no 2 consecutive same word, no 3+ consecutive same round type
  return constrainedShuffle(candidates.slice(0, config.questionCount))
}

function constrainedShuffle(questions: DrillQuestion[]): DrillQuestion[] {
  const result = shuffle(questions)

  // Simple constraint repair: swap violations with a later non-violating item
  for (let i = 1; i < result.length; i++) {
    const prev = result[i - 1]
    const curr = result[i]

    // Check same-word constraint
    const sameWord = curr.word.danish === prev.word.danish

    // Check 3+ consecutive same round type
    const threeConsecutive =
      i >= 2 &&
      curr.roundType === prev.roundType &&
      curr.roundType === result[i - 2].roundType

    if (sameWord || threeConsecutive) {
      // Find a swap candidate further ahead
      for (let j = i + 1; j < result.length; j++) {
        const candidate = result[j]
        const wouldViolateWord = candidate.word.danish === prev.word.danish
        const wouldViolateType =
          i >= 2 &&
          candidate.roundType === prev.roundType &&
          candidate.roundType === result[i - 2].roundType

        if (!wouldViolateWord && !wouldViolateType) {
          ;[result[i], result[j]] = [result[j], result[i]]
          break
        }
      }
    }
  }

  return result
}
