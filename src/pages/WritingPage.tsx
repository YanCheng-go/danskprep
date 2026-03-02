import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WritingPrompt } from '@/components/writing/WritingPrompt'
import type { WritingPromptData } from '@/components/writing/WritingPrompt'
import { WritingFeedback } from '@/components/writing/WritingFeedback'
import { scoreWriting, hasAIProvider } from '@/lib/ai-scoring'
import type { WritingScore } from '@/lib/ai-scoring'
import { DANISH_CHARS } from '@/lib/danish-input'
import promptsData from '@/data/seed/writing-prompts-pd3m2.json'
import { useTranslation } from '@/lib/i18n'

const prompts = promptsData as WritingPromptData[]

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

export function WritingPage() {
  const [promptIndex, setPromptIndex] = useState(0)
  const [response, setResponse] = useState('')
  const [scoring, setScoring] = useState(false)
  const [score, setScore] = useState<WritingScore | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  const currentPrompt = prompts[promptIndex]
  const wordCount = countWords(response)
  const hasApiKey = hasAIProvider()

  async function handleSubmit() {
    if (!currentPrompt) return
    setScoring(true)
    setError(null)
    try {
      const result = await scoreWriting(currentPrompt.prompt, response)
      setScore(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scoring failed')
    } finally {
      setScoring(false)
    }
  }

  function nextPrompt() {
    setPromptIndex(i => (i + 1) % prompts.length)
    setResponse('')
    setScore(null)
    setError(null)
  }

  function insertChar(char: string) {
    setResponse(prev => prev + char)
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('writing.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('writing.subtitle')}
        </p>
      </div>

      {/* Prompt selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">
          {t('writing.promptOf', { current: promptIndex + 1, total: prompts.length })}
        </span>
        <Button variant="outline" size="sm" onClick={nextPrompt}>
          {t('writing.nextPrompt')}
        </Button>
      </div>

      <div className="space-y-4">
        <WritingPrompt prompt={currentPrompt} />

        {/* Writing area */}
        {!score ? (
          <div className="space-y-3">
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Skriv dit svar her..."
              rows={8}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[150px]"
            />

            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {DANISH_CHARS.map(char => (
                  <Button
                    key={char}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertChar(char)}
                    className="font-mono text-base min-h-9"
                  >
                    {char}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    wordCount >= currentPrompt.min_words ? 'default' : 'secondary'
                  }
                  className="text-xs"
                >
                  {t('writing.wordCount', { count: wordCount })}
                </Badge>
                {wordCount > currentPrompt.max_words && (
                  <Badge variant="destructive" className="text-xs">
                    {t('writing.overLimit')}
                  </Badge>
                )}
              </div>
            </div>

            {!hasApiKey && (
              <div className="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-4 py-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t('writing.apiKeyRequired')}
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={wordCount < currentPrompt.min_words || scoring || !hasApiKey}
            >
              {scoring ? t('writing.scoring') : t('writing.submit')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User's response */}
            <div className="rounded-md border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('writing.yourResponse')}</p>
              <p className="text-sm whitespace-pre-wrap">{response}</p>
            </div>

            <WritingFeedback score={score} />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setScore(null) }}>
                {t('writing.editResubmit')}
              </Button>
              <Button className="flex-1" onClick={nextPrompt}>
                {t('writing.nextPrompt')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
