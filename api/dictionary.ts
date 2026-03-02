import type { VercelRequest, VercelResponse } from '@vercel/node'
import * as cheerio from 'cheerio'

interface DictionaryEntry {
  headword: string
  partOfSpeech: string
  partOfSpeechNormalized: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection' | 'unknown'
  pronunciation: string
  definitions: { text: string; examples: string[] }[]
  inflections: string[]
  gender: 'en' | 'et' | null
  structuredInflections: Record<string, string> | null
}

type NormalizedPOS = 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection' | 'unknown'

const POS_MAP: [RegExp, NormalizedPOS][] = [
  [/substantiv/i, 'noun'],
  [/verbum/i, 'verb'],
  [/adjektiv/i, 'adjective'],
  [/adverbium/i, 'adverb'],
  [/pronomen/i, 'pronoun'],
  [/præposition/i, 'preposition'],
  [/konjunktion/i, 'conjunction'],
  [/interjektion/i, 'interjection'],
]

function normalizePOS(pos: string): NormalizedPOS {
  for (const [pattern, value] of POS_MAP) {
    if (pattern.test(pos)) return value
  }
  return 'unknown'
}

function extractGender(pos: string): 'en' | 'et' | null {
  const lower = pos.toLowerCase()
  if (lower.includes('fælleskøn')) return 'en'
  if (lower.includes('intetkøn')) return 'et'
  return null
}

function resolveSuffix(headword: string, suffix: string): string {
  const trimmed = suffix.trim()
  if (trimmed.startsWith('-')) {
    return headword + trimmed.slice(1)
  }
  return trimmed
}

function buildStructuredInflections(
  headword: string,
  rawInflections: string[],
  pos: string
): Record<string, string> | null {
  if (rawInflections.length === 0) return null

  const resolved = rawInflections.map(s => resolveSuffix(headword, s))
  const lower = pos.toLowerCase()

  if (lower.includes('substantiv') && resolved.length >= 3) {
    return {
      definite: resolved[0],
      plural_indef: resolved[1],
      plural_def: resolved[2],
    }
  }

  if (lower.includes('verbum') && resolved.length >= 4) {
    return {
      present: resolved[0],
      past: resolved[1],
      perfect: resolved[2],
      imperative: resolved[3],
    }
  }

  if (lower.includes('adjektiv') && resolved.length >= 2) {
    const result: Record<string, string> = {
      t_form: resolved[0],
      e_form: resolved[1],
    }
    if (resolved[2]) result.comparative = resolved[2]
    if (resolved[3]) result.superlative = resolved[3]
    return result
  }

  // Fallback: generic numbered forms
  const result: Record<string, string> = {}
  resolved.forEach((form, i) => {
    result[`form_${i + 1}`] = form
  })
  return result
}

export function parseDDOHtml(html: string, query: string): { entry?: DictionaryEntry; suggestions?: string[] } {
  const $ = cheerio.load(html)

  const article = $('.artikel')
  if (article.length === 0) {
    // No article found — collect "did you mean" suggestions
    const suggestions: string[] = []
    $('#LemmasInSearch a, .LemmaGroup a, #LemmaResult a, .LemmaSearch a').each((_, el) => {
      const text = $(el).text().trim()
      if (text && !suggestions.includes(text)) suggestions.push(text)
    })
    return { suggestions: suggestions.slice(0, 5) }
  }

  // Headword: inside .definitionBoxTop > .match
  const headword = article.find('.definitionBoxTop .match').first().clone().children('.super').remove().end().text().trim() || query

  // Part of speech: .definitionBoxTop > .tekstmedium
  const partOfSpeech = article.find('.definitionBoxTop .tekstmedium').first().text().trim()

  // Pronunciation: #id-udt .lydskrift
  let pronunciation = ''
  const pronEl = article.find('#id-udt .lydskrift').first()
  if (pronEl.length) {
    // Extract just the IPA portion (text inside brackets)
    const fullText = pronEl.text().trim()
    const ipaMatch = fullText.match(/\[([^\]]+)\]/)
    pronunciation = ipaMatch ? `[${ipaMatch[1]}]` : ''
  }

  // Inflections: #id-boj .tekstmedium text (e.g. "-en, -e, -ene")
  const inflections: string[] = []
  const bojText = article.find('#id-boj .tekstmedium').first().text().trim()
  if (bojText) {
    bojText.split(',').forEach(form => {
      const f = form.trim()
      if (f) inflections.push(f)
    })
  }

  // Definitions: .definitionIndent .definition
  const definitions: { text: string; examples: string[] }[] = []
  article.find('#content-betydninger .definitionIndent').each((_, indent) => {
    const defEl = $(indent).find('.definition').first()
    const defText = defEl.text().trim()
    if (!defText) return

    // Collect example sentences from this definition block
    const examples: string[] = []
    $(indent).find('.444, .444').each((_, ex) => {
      const exText = $(ex).text().trim()
      if (exText && exText !== defText) examples.push(exText)
    })

    definitions.push({ text: defText, examples: examples.slice(0, 3) })
  })

  // Fallback: if no definitions found via #content-betydninger, try overview links
  if (definitions.length === 0) {
    article.find('#overblik-betyd a').each((_, el) => {
      const text = $(el).text().trim()
      if (text && text.length > 3) {
        definitions.push({ text, examples: [] })
      }
    })
  }

  const gender = extractGender(partOfSpeech)
  const partOfSpeechNormalized = normalizePOS(partOfSpeech)
  const trimmedInflections = inflections.slice(0, 10)
  const structuredInflections = buildStructuredInflections(headword, trimmedInflections, partOfSpeech)

  return {
    entry: {
      headword,
      partOfSpeech,
      partOfSpeechNormalized,
      pronunciation,
      definitions: definitions.slice(0, 8),
      inflections: trimmedInflections,
      gender,
      structuredInflections,
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = (req.query.q as string || '').trim()
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter "q"' })
  }

  try {
    const url = `https://ordnet.dk/ddo/ordbog?query=${encodeURIComponent(q)}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'da,en;q=0.5',
      },
    })

    if (response.status >= 500) {
      return res.status(502).json({ error: 'Failed to fetch from ordnet.dk' })
    }

    const html = await response.text()
    const result = parseDDOHtml(html, q)

    if (!result.entry) {
      return res.status(404).json({
        error: 'not_found',
        suggestions: result.suggestions ?? [],
      })
    }

    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600')
    return res.status(200).json(result.entry)
  } catch {
    return res.status(502).json({ error: 'Failed to fetch dictionary data' })
  }
}
