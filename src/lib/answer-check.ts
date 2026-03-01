import type { AnswerResult } from '@/types/quiz'

/** Normalize a Danish string for comparison.
 *  - Lowercases and trims
 *  - Collapses multiple whitespace to single space
 *  - Accepts Latin fallbacks: ae→æ, oe→ø, aa→å
 */
export function normalizeDanish(text: string, acceptLatin = true): string {
  let s = text.toLowerCase().trim().replace(/\s+/g, ' ')
  if (acceptLatin) {
    s = s
      .replace(/ae/g, 'æ')
      .replace(/oe/g, 'ø')
      .replace(/aa/g, 'å')
  }
  return s
}

/** Standard Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  return dp[m][n]
}

/**
 * Damerau-Levenshtein distance — counts transpositions (swapped adjacent chars)
 * as a single edit. More appropriate for natural typo detection.
 */
export function damerauLevenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      )
      // Transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1)
      }
    }
  }
  return dp[m][n]
}

/**
 * Check a user's answer against the correct answer and acceptable alternatives.
 * Returns whether it's correct, almost correct (DL distance ≤ 1 after normalization),
 * and the normalized forms for display.
 */
export function checkAnswer(
  userInput: string,
  correctAnswer: string,
  acceptableAnswers: string[] = [],
  acceptLatin = true
): AnswerResult {
  const normalizedUser = normalizeDanish(userInput, acceptLatin)
  const normalizedCorrect = normalizeDanish(correctAnswer, acceptLatin)

  const allCorrect = [
    normalizedCorrect,
    ...acceptableAnswers.map(a => normalizeDanish(a, acceptLatin)),
  ]

  const isCorrect = allCorrect.includes(normalizedUser)

  // Typo tolerance: Damerau-Levenshtein ≤ 1, answer must be longer than 2 chars
  const isAlmostCorrect =
    !isCorrect &&
    normalizedUser.length > 2 &&
    allCorrect.some(correct => damerauLevenshtein(normalizedUser, correct) <= 1)

  return {
    isCorrect,
    isAlmostCorrect,
    normalizedUser,
    normalizedCorrect,
  }
}
