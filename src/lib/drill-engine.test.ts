import { describe, it, expect, beforeEach } from 'vitest'
import type { Word } from '@/types/database'
import {
  generateTranslationEnDa,
  generateTranslationDaEn,
  generateContextCloze,
  generateParadigmFill,
  generateFormChoice,
  buildDrillSession,
  resetIdCounter,
} from './drill-engine'

// ─── Test fixtures ──────────────────────────────────────────────────────────

const nounBil: Word = {
  id: '1',
  danish: 'bil',
  english: 'car',
  part_of_speech: 'noun',
  gender: 'en',
  module_level: 2,
  difficulty: 1,
  tags: ['transport'],
  inflections: {
    definite: 'bilen',
    plural_indef: 'biler',
    plural_def: 'bilerne',
  },
  example_da: 'Jeg kører min bil til arbejde hver dag.',
  example_en: 'I drive my car to work every day.',
  source: 'test',
  created_at: '',
}

const verbSpise: Word = {
  id: '2',
  danish: 'spise',
  english: 'to eat',
  part_of_speech: 'verb',
  gender: null,
  module_level: 2,
  difficulty: 1,
  tags: ['food'],
  inflections: {
    present: 'spiser',
    past: 'spiste',
    perfect: 'har spist',
    imperative: 'spis',
  },
  example_da: 'Vi spiser aftensmad klokken seks.',
  example_en: 'We eat dinner at six o\'clock.',
  source: 'test',
  created_at: '',
}

const adjStor: Word = {
  id: '3',
  danish: 'stor',
  english: 'big, large',
  part_of_speech: 'adjective',
  gender: null,
  module_level: 2,
  difficulty: 1,
  tags: ['description'],
  inflections: {
    t_form: 'stort',
    e_form: 'store',
    comparative: 'større',
    superlative: 'størst',
  },
  example_da: 'Det er et stort problem.',
  example_en: 'It is a big problem.',
  source: 'test',
  created_at: '',
}

const wordNoInflections: Word = {
  id: '4',
  danish: 'komme',
  english: 'to come',
  part_of_speech: 'verb',
  gender: null,
  module_level: 2,
  difficulty: 1,
  tags: [],
  inflections: {},
  example_da: null,
  example_en: null,
  source: 'test',
  created_at: '',
}

const wordNoExample: Word = {
  id: '5',
  danish: 'gå',
  english: 'to walk',
  part_of_speech: 'verb',
  gender: null,
  module_level: 2,
  difficulty: 1,
  tags: [],
  inflections: {
    present: 'går',
    past: 'gik',
    perfect: 'har gået',
    imperative: 'gå',
  },
  example_da: null,
  example_en: null,
  source: 'test',
  created_at: '',
}

beforeEach(() => {
  resetIdCounter()
})

// ─── Translation EN→DA ──────────────────────────────────────────────────────

describe('generateTranslationEnDa', () => {
  it('generates question for a noun', () => {
    const q = generateTranslationEnDa(nounBil)
    expect(q.roundType).toBe('translation_en_da')
    expect(q.prompt).toBe('Translate to Danish: car')
    expect(q.correctAnswer).toBe('bil')
    expect(q.acceptableAnswers).toContain('en bil')
    expect(q.acceptableAnswers).toContain('bil')
  })

  it('generates question for a verb', () => {
    const q = generateTranslationEnDa(verbSpise)
    expect(q.prompt).toBe('Translate to Danish: to eat')
    expect(q.correctAnswer).toBe('spise')
    expect(q.acceptableAnswers).toContain('at spise')
  })

  it('includes hint for nouns', () => {
    const q = generateTranslationEnDa(nounBil)
    expect(q.hint).toBe('(en-ord)')
  })

  it('includes example as explanation', () => {
    const q = generateTranslationEnDa(nounBil)
    expect(q.explanation).toContain('Jeg kører min bil')
  })
})

// ─── Translation DA→EN ──────────────────────────────────────────────────────

describe('generateTranslationDaEn', () => {
  it('displays noun with gender', () => {
    const q = generateTranslationDaEn(nounBil)
    expect(q.prompt).toBe("What does 'en bil' mean?")
    expect(q.correctAnswer).toBe('car')
  })

  it('displays verb with "at"', () => {
    const q = generateTranslationDaEn(verbSpise)
    expect(q.prompt).toBe("What does 'at spise' mean?")
    expect(q.correctAnswer).toBe('to eat')
    expect(q.acceptableAnswers).toContain('eat')
  })

  it('displays adjective without prefix', () => {
    const q = generateTranslationDaEn(adjStor)
    expect(q.prompt).toBe("What does 'stor' mean?")
  })
})

// ─── Context Cloze ──────────────────────────────────────────────────────────

describe('generateContextCloze', () => {
  it('replaces a word form in the example sentence', () => {
    const q = generateContextCloze(nounBil)
    expect(q).not.toBeNull()
    expect(q!.prompt).toContain('___')
    expect(q!.prompt).not.toContain('bil')
    expect(q!.correctAnswer).toBe('bil')
  })

  it('matches inflected form in sentence', () => {
    const q = generateContextCloze(verbSpise)
    expect(q).not.toBeNull()
    // "Vi spiser aftensmad" should match "spiser"
    expect(q!.prompt).toContain('___')
    expect(q!.correctAnswer).toBe('spiser')
  })

  it('returns null when no example_da', () => {
    const q = generateContextCloze(wordNoExample)
    expect(q).toBeNull()
  })

  it('returns null when no form found in sentence', () => {
    const weird: Word = {
      ...nounBil,
      example_da: 'This sentence has no matching word.',
      inflections: {},
      danish: 'xyz',
    }
    const q = generateContextCloze(weird)
    expect(q).toBeNull()
  })

  it('provides hint from English translation', () => {
    const q = generateContextCloze(nounBil)
    expect(q!.hint).toBe('I drive my car to work every day.')
  })
})

// ─── Paradigm Fill ──────────────────────────────────────────────────────────

describe('generateParadigmFill', () => {
  it('generates a question with one blank', () => {
    const q = generateParadigmFill(verbSpise)
    expect(q).not.toBeNull()
    expect(q!.roundType).toBe('paradigm_fill')
    expect(q!.prompt).toContain('___')
    expect(q!.inflectionKey).toBeTruthy()
    expect(q!.paradigmContext).toBeDefined()
  })

  it('paradigmContext does not include the tested key', () => {
    const q = generateParadigmFill(verbSpise)
    expect(q).not.toBeNull()
    // The paradigmContext should not contain the tested form's value
    const contextValues = Object.values(q!.paradigmContext!)
    expect(contextValues).not.toContain(q!.correctAnswer)
  })

  it('returns null for words with empty inflections', () => {
    const q = generateParadigmFill(wordNoInflections)
    expect(q).toBeNull()
  })

  it('returns null for words with only one inflection', () => {
    const oneInfl: Word = {
      ...nounBil,
      inflections: { definite: 'bilen' },
    }
    const q = generateParadigmFill(oneInfl)
    expect(q).toBeNull()
  })

  it('shows word header with gender for nouns', () => {
    const q = generateParadigmFill(nounBil)
    expect(q).not.toBeNull()
    expect(q!.prompt).toContain('en bil (car)')
  })

  it('shows word header with "at" for verbs', () => {
    const q = generateParadigmFill(verbSpise)
    expect(q).not.toBeNull()
    expect(q!.prompt).toContain('at spise (to eat)')
  })
})

// ─── Form Choice ────────────────────────────────────────────────────────────

describe('generateFormChoice', () => {
  it('generates a multiple choice question', () => {
    const q = generateFormChoice(adjStor)
    expect(q).not.toBeNull()
    expect(q!.roundType).toBe('form_choice')
    expect(q!.alternatives).toBeDefined()
    expect(q!.alternatives!.length).toBeGreaterThanOrEqual(2)
    expect(q!.alternatives!).toContain(q!.correctAnswer)
  })

  it('returns null for words with <2 inflections', () => {
    const q = generateFormChoice(wordNoInflections)
    expect(q).toBeNull()
  })

  it('alternatives are from the same word', () => {
    const q = generateFormChoice(verbSpise)
    expect(q).not.toBeNull()
    const verbForms = Object.values(verbSpise.inflections!)
    for (const alt of q!.alternatives!) {
      expect(verbForms).toContain(alt)
    }
  })
})

// ─── Session Assembly ───────────────────────────────────────────────────────

describe('buildDrillSession', () => {
  const words = [nounBil, verbSpise, adjStor, wordNoInflections, wordNoExample]

  it('returns requested number of questions', () => {
    const questions = buildDrillSession(words, {
      posFilter: [],
      roundTypes: [],
      questionCount: 10,
    })
    expect(questions.length).toBe(10)
  })

  it('respects POS filter', () => {
    const questions = buildDrillSession(words, {
      posFilter: ['noun'],
      roundTypes: ['translation_en_da'],
      questionCount: 5,
    })
    expect(questions.length).toBe(5)
    for (const q of questions) {
      expect(q.word.part_of_speech).toBe('noun')
    }
  })

  it('respects round type filter', () => {
    const questions = buildDrillSession(words, {
      posFilter: [],
      roundTypes: ['translation_en_da'],
      questionCount: 5,
    })
    for (const q of questions) {
      expect(q.roundType).toBe('translation_en_da')
    }
  })

  it('no two consecutive questions on the same word', () => {
    const questions = buildDrillSession(words, {
      posFilter: [],
      roundTypes: [],
      questionCount: 15,
    })
    for (let i = 1; i < questions.length; i++) {
      // This is best-effort — may not be fixable if only 1 word
      if (words.filter(w => ['noun', 'verb', 'adjective'].includes(w.part_of_speech)).length > 1) {
        expect(questions[i].word.danish).not.toBe(questions[i - 1].word.danish)
      }
    }
  })

  it('returns empty array when no words match POS filter', () => {
    const questions = buildDrillSession(words, {
      posFilter: ['noun'],
      roundTypes: [],
      questionCount: 5,
    })
    // Should still work — we have 1 noun
    expect(questions.length).toBe(5)

    const empty = buildDrillSession([], {
      posFilter: [],
      roundTypes: [],
      questionCount: 5,
    })
    expect(empty.length).toBe(0)
  })

  it('backfills with translation rounds when paradigm pool is small', () => {
    // Use only words without inflections
    const questions = buildDrillSession([wordNoInflections], {
      posFilter: [],
      roundTypes: [],
      questionCount: 5,
    })
    // Should still generate 5 questions, all translation types
    expect(questions.length).toBe(5)
    for (const q of questions) {
      expect(['translation_en_da', 'translation_da_en']).toContain(q.roundType)
    }
  })
})
