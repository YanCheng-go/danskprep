/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import type { Plugin } from 'vite'

/**
 * Dev-only middleware that handles /api/dictionary requests locally,
 * mirroring the Vercel serverless function in api/dictionary.ts.
 */
function dictionaryDevProxy(): Plugin {
  return {
    name: 'dictionary-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/dictionary')) return next()

        const url = new URL(req.url, 'http://localhost')
        const q = url.searchParams.get('q')?.trim()
        if (!q) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Missing query parameter "q"' }))
          return
        }

        try {
          const ddoUrl = `https://ordnet.dk/ddo/ordbog?query=${encodeURIComponent(q)}`
          const response = await fetch(ddoUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
              'Accept': 'text/html,application/xhtml+xml',
              'Accept-Language': 'da,en;q=0.5',
            },
          })

          if (response.status >= 500) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Failed to fetch from ordnet.dk' }))
            return
          }

          const html = await response.text()

          // Inline cheerio import (dynamic so it doesn't block startup)
          const cheerio = await import('cheerio')
          const $ = cheerio.load(html)

          const article = $('.artikel')
          if (article.length === 0) {
            // ordnet.dk returns 404 for unknown words — parse suggestions from the page
            const suggestions: string[] = []
            $('#LemmasInSearch a, .LemmaGroup a, #LemmaResult a, .LemmaSearch a').each((_, el) => {
              const text = $(el).text().trim()
              if (text && !suggestions.includes(text)) suggestions.push(text)
            })
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'not_found', suggestions: suggestions.slice(0, 5) }))
            return
          }

          const headword = article.find('.definitionBoxTop .match').first().clone().children('.super').remove().end().text().trim() || q
          const partOfSpeech = article.find('.definitionBoxTop .tekstmedium').first().text().trim()

          let pronunciation = ''
          const pronEl = article.find('#id-udt .lydskrift').first()
          if (pronEl.length) {
            const fullText = pronEl.text().trim()
            const ipaMatch = fullText.match(/\[([^\]]+)\]/)
            pronunciation = ipaMatch ? `[${ipaMatch[1]}]` : ''
          }

          const inflections: string[] = []
          const bojText = article.find('#id-boj .tekstmedium').first().text().trim()
          if (bojText) {
            bojText.split(',').forEach((form: string) => {
              const f = form.trim()
              if (f) inflections.push(f)
            })
          }

          const definitions: { text: string; examples: string[] }[] = []
          article.find('#content-betydninger .definitionIndent').each((_, indent) => {
            const defEl = $(indent).find('.definition').first()
            const defText = defEl.text().trim()
            if (!defText) return
            definitions.push({ text: defText, examples: [] })
          })
          if (definitions.length === 0) {
            article.find('#overblik-betyd a').each((_, el) => {
              const text = $(el).text().trim()
              if (text && text.length > 3) {
                definitions.push({ text, examples: [] })
              }
            })
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            headword,
            partOfSpeech,
            pronunciation,
            definitions: definitions.slice(0, 8),
            inflections: inflections.slice(0, 10),
          }))
        } catch {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Failed to fetch dictionary data' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), dictionaryDevProxy()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // @ts-expect-error vitest augments UserConfig with 'test'
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
