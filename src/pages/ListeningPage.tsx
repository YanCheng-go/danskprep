import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, XCircle, Headphones, ExternalLink } from 'lucide-react'
import episodesData from '@/data/seed/listening-episodes.json'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

interface VocabHighlight {
  danish: string
  english: string
  gender?: string
}

interface ComprehensionQuestion {
  question: string
  correct_answer: string
  options: string[]
  explanation: string
}

interface ListeningEpisode {
  id: string
  number: number
  title: string
  title_en: string
  description: string
  description_en: string
  audio_url: string
  duration_seconds: number
  level: string
  topics: string[]
  vocab_highlights: VocabHighlight[]
  comprehension_questions: ComprehensionQuestion[]
  transcript_excerpt: string
  source: string
  published_date: string
}

const episodes = episodesData as ListeningEpisode[]

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ListeningPage() {
  const [selectedEpisode, setSelectedEpisode] = useState<ListeningEpisode | null>(null)
  const { t } = useTranslation()

  if (selectedEpisode) {
    return (
      <PageContainer>
        <EpisodePlayer
          episode={selectedEpisode}
          onBack={() => setSelectedEpisode(null)}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('podcast.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('podcast.subtitle')}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {t('listening.episodesBy')}{' '}
          <a
            href="https://danskioererne.dk"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors inline-flex items-center gap-0.5"
          >
            Dansk i ørerne <ExternalLink className="h-3 w-3" />
          </a>
          {' '}{t('listening.by')} Sofie Lindholm
        </p>
      </div>

      <div className="space-y-3">
        {episodes.map(ep => (
          <Card
            key={ep.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setSelectedEpisode(ep)}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Headphones className="h-4 w-4 text-muted-foreground shrink-0" />
                    <h3 className="font-medium text-sm truncate">
                      #{ep.number} {ep.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {ep.description_en}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {ep.level}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {formatDuration(ep.duration_seconds)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {t('listening.questions', { count: ep.comprehension_questions.length })}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  )
}

// ─── Episode Player ────────────────────────────────────────────────────────

interface EpisodePlayerProps {
  episode: ListeningEpisode
  onBack: () => void
}

function EpisodePlayer({ episode, onBack }: EpisodePlayerProps) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [showVocab, setShowVocab] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<(string | null)[]>(
    new Array(episode.comprehension_questions.length).fill(null)
  )
  const [showResults, setShowResults] = useState(false)
  const { t } = useTranslation()

  const questions = episode.comprehension_questions

  function handleAnswer(option: string) {
    if (answers[currentQ] !== null) return
    const newAnswers = [...answers]
    newAnswers[currentQ] = option
    setAnswers(newAnswers)
  }

  function nextQuestion() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      setShowResults(true)
    }
  }

  const correctCount = answers.filter(
    (a, i) => a === questions[i]?.correct_answer
  ).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          &larr; {t('listening.backToEpisodes')}
        </button>
        <h1 className="text-xl font-bold">#{episode.number} {episode.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{episode.title_en}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Badge variant="outline">{episode.level}</Badge>
          <Badge variant="secondary">{formatDuration(episode.duration_seconds)}</Badge>
          {episode.topics.map(topic => (
            <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
          ))}
        </div>
      </div>

      {/* Audio player */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <p className="text-sm font-medium">{t('listening.listenToEpisode')}</p>
          <audio
            src={episode.audio_url}
            controls
            preload="none"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            {t('listening.listenTip')}
          </p>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm">{episode.description}</p>
          <p className="text-xs text-muted-foreground mt-2 italic">{episode.description_en}</p>
        </CardContent>
      </Card>

      {/* Vocab highlights */}
      <div>
        <button
          onClick={() => setShowVocab(!showVocab)}
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          {showVocab
            ? t('listening.hideVocab', { count: episode.vocab_highlights.length })
            : t('listening.showVocab', { count: episode.vocab_highlights.length })}
        </button>
        {showVocab && (
          <div className="mt-2 rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {episode.vocab_highlights.map((v, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                    <td className="px-4 py-2 font-medium">
                      {v.gender ? `(${v.gender}) ` : ''}{v.danish}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{v.english}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transcript */}
      <div>
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          {showTranscript ? t('listening.hideTranscript') : t('listening.showTranscript')}
        </button>
        {showTranscript && (
          <div className="mt-2 rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {episode.transcript_excerpt}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              {t('listening.fullTranscript')}{' '}
              <a
                href="https://danskioererne.dk"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                danskioererne.dk
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Comprehension quiz */}
      {!quizStarted ? (
        <Button
          className="w-full"
          onClick={() => setQuizStarted(true)}
        >
          {t('listening.startQuiz', { count: questions.length })}
        </Button>
      ) : !showResults ? (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t('listening.questionOf', { current: currentQ + 1, total: questions.length })}
              </p>
            </div>
            <p className="text-sm font-medium">{questions[currentQ].question}</p>
            <div className="space-y-2">
              {questions[currentQ].options.map(option => {
                const selected = answers[currentQ] === option
                const isCorrect = option === questions[currentQ].correct_answer
                const answered = answers[currentQ] !== null

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={answered}
                    className={cn(
                      'w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors',
                      !answered && 'hover:bg-accent',
                      answered && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                      answered && selected && !isCorrect && 'border-red-500 bg-red-50 dark:bg-red-950/30',
                      answered && !selected && !isCorrect && 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {answered && isCorrect && <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />}
                      {answered && selected && !isCorrect && <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
                      <span>{option}</span>
                    </div>
                  </button>
                )
              })}
            </div>
            {answers[currentQ] !== null && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {questions[currentQ].explanation}
                </p>
                <Button onClick={nextQuestion} className="w-full" size="sm">
                  {currentQ < questions.length - 1 ? t('listening.nextQuestion') : t('listening.seeResults')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-4 text-center">
            <p className="text-lg font-bold">
              {t('listening.correctCount', { correct: correctCount, total: questions.length })}
            </p>
            <p className="text-sm text-muted-foreground">
              {correctCount === questions.length
                ? t('listening.perfect')
                : correctCount >= questions.length / 2
                ? t('listening.good')
                : t('listening.keepPracticing')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setQuizStarted(false)
                  setCurrentQ(0)
                  setAnswers(new Array(questions.length).fill(null))
                  setShowResults(false)
                }}
              >
                {t('listening.retryQuiz')}
              </Button>
              <Button className="flex-1" onClick={onBack}>
                {t('listening.moreEpisodes')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
