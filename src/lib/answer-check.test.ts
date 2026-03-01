import { describe, it, expect } from 'vitest'
import { normalizeDanish, levenshtein, damerauLevenshtein, checkAnswer } from './answer-check'

describe('normalizeDanish', () => {
  it('lowercases and trims', () => {
    expect(normalizeDanish('  Bilen  ')).toBe('bilen')
  })
  it('replaces ae with æ', () => {
    expect(normalizeDanish('maend')).toBe('mænd')
  })
  it('replaces oe with ø', () => {
    expect(normalizeDanish('stoerre')).toBe('større')
  })
  it('replaces aa with å', () => {
    expect(normalizeDanish('saa')).toBe('så')
  })
  it('collapses multiple spaces', () => {
    expect(normalizeDanish('har  spist')).toBe('har spist')
  })
  it('does not replace when acceptLatin=false', () => {
    expect(normalizeDanish('maend', false)).toBe('maend')
  })
})

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('bilen', 'bilen')).toBe(0)
  })
  it('returns 1 for single substitution', () => {
    expect(levenshtein('bilen', 'bilan')).toBe(1)
  })
  it('returns 1 for single deletion', () => {
    expect(levenshtein('bilen', 'bien')).toBe(1)
  })
  it('returns 2 for transposition (standard Levenshtein)', () => {
    // 'bilne' vs 'bilen' is a transposition = 2 in standard Levenshtein
    expect(levenshtein('bilne', 'bilen')).toBe(2)
  })
})

describe('damerauLevenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(damerauLevenshtein('bilen', 'bilen')).toBe(0)
  })
  it('returns 1 for transposition', () => {
    // bilne ↔ bilen: adjacent transposition = 1
    expect(damerauLevenshtein('bilne', 'bilen')).toBe(1)
  })
  it('returns 1 for single substitution', () => {
    expect(damerauLevenshtein('bilen', 'bilan')).toBe(1)
  })
})

describe('checkAnswer', () => {
  it('marks exact match as correct', () => {
    const result = checkAnswer('bilen', 'bilen')
    expect(result.isCorrect).toBe(true)
    expect(result.isAlmostCorrect).toBe(false)
  })

  it('marks Latin fallback as correct', () => {
    const result = checkAnswer('maend', 'mænd')
    expect(result.isCorrect).toBe(true)
  })

  it('is case-insensitive', () => {
    const result = checkAnswer('BILEN', 'bilen')
    expect(result.isCorrect).toBe(true)
  })

  it('accepts acceptable_answers', () => {
    const result = checkAnswer('boern', 'børn', ['boern'])
    expect(result.isCorrect).toBe(true)
  })

  it('marks transposition typo as almostCorrect', () => {
    // bilne vs bilen: transposition, DL distance = 1
    const result = checkAnswer('bilne', 'bilen')
    expect(result.isCorrect).toBe(false)
    expect(result.isAlmostCorrect).toBe(true)
  })

  it('marks single-char substitution typo as almostCorrect', () => {
    const result = checkAnswer('bilan', 'bilen')
    expect(result.isCorrect).toBe(false)
    expect(result.isAlmostCorrect).toBe(true)
  })

  it('marks clearly wrong answer as incorrect', () => {
    const result = checkAnswer('huset', 'bilen')
    expect(result.isCorrect).toBe(false)
    expect(result.isAlmostCorrect).toBe(false)
  })
})
