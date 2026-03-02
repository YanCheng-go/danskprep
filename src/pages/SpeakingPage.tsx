import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { RecordButton } from '@/components/speaking/RecordButton'
import { SpeakingFeedback } from '@/components/speaking/SpeakingFeedback'
import { useRecorder } from '@/hooks/useRecorder'
import { scoreWriting, hasAIProvider } from '@/lib/ai-scoring'
import type { WritingScore } from '@/lib/ai-scoring'
import { DANISH_CHARS } from '@/lib/danish-input'
import promptsData from '@/data/seed/speaking-prompts-pd3m2.json'
import { useTranslation } from '@/lib/i18n'

interface SpeakingPrompt {
  id: string
  title: string
  prompt: string
  prompt_en: string
  tips: string[]
  duration_seconds: number
}

const prompts = promptsData as SpeakingPrompt[]

export function SpeakingPage() {
  const [promptIndex, setPromptIndex] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [scoring, setScoring] = useState(false)
  const [score, setScore] = useState<WritingScore | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recorder = useRecorder()
  const { t } = useTranslation()

  const currentPrompt = prompts[promptIndex]
  const hasApiKey = hasAIProvider()

  async function handleScore() {
    if (!transcription.trim()) return
    setScoring(true)
    setError(null)
    try {
      const result = await scoreWriting(currentPrompt.prompt, transcription)
      setScore(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scoring failed')
    } finally {
      setScoring(false)
    }
  }

  function nextPrompt() {
    setPromptIndex(i => (i + 1) % prompts.length)
    setTranscription('')
    setScore(null)
    setError(null)
    recorder.reset()
  }

  function insertChar(char: string) {
    setTranscription(prev => prev + char)
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('speaking.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('speaking.subtitle')}
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
        {/* Prompt card */}
        <Card>
          <CardContent className="pt-5 space-y-3">
            <h2 className="text-lg font-semibold">{currentPrompt.title}</h2>
            <p className="text-sm">{currentPrompt.prompt}</p>
            <p className="text-sm text-muted-foreground italic">{currentPrompt.prompt_en}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                ~{Math.floor(currentPrompt.duration_seconds / 60)} min
              </Badge>
            </div>
            {currentPrompt.tips.length > 0 && (
              <div className="rounded-md bg-muted px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('speaking.tips')}</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {currentPrompt.tips.map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {!score ? (
          <div className="space-y-4">
            {/* Step 1: Record */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('speaking.step1')}</h3>
              <div className="flex items-center gap-3">
                <RecordButton
                  isRecording={recorder.isRecording}
                  duration={recorder.duration}
                  onStart={recorder.startRecording}
                  onStop={recorder.stopRecording}
                />
              </div>
              {recorder.error && (
                <p className="text-sm text-destructive">{recorder.error}</p>
              )}
              {recorder.audioUrl && (
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground mb-2">{t('speaking.playback')}</p>
                  <audio src={recorder.audioUrl} controls className="w-full" />
                </div>
              )}
            </div>

            {/* Step 2: Transcribe */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('speaking.step2')}</h3>
              <p className="text-xs text-muted-foreground">
                {t('speaking.step2hint')}
              </p>
              <textarea
                value={transcription}
                onChange={e => setTranscription(e.target.value)}
                placeholder="Skriv hvad du sagde..."
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
              />
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
            </div>

            {!hasApiKey && (
              <div className="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-4 py-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t('writing.apiKeyRequired')}
                </p>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Step 3: Score */}
            <Button
              className="w-full"
              onClick={handleScore}
              disabled={!transcription.trim() || scoring || !hasApiKey}
            >
              {scoring ? t('writing.scoring') : t('writing.submit')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('speaking.yourTranscription')}</p>
              <p className="text-sm whitespace-pre-wrap">{transcription}</p>
            </div>

            <SpeakingFeedback score={score} />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setScore(null)}>
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
