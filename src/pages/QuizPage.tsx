import { useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuiz } from '@/hooks/useQuiz'
import { PageContainer } from '@/components/layout/PageContainer'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TypeAnswer } from '@/components/quiz/TypeAnswer'
import { MultipleChoice } from '@/components/quiz/MultipleChoice'
import { Cloze } from '@/components/quiz/Cloze'
import { WordOrder } from '@/components/quiz/WordOrder'
import { ErrorCorrection } from '@/components/quiz/ErrorCorrection'
import { FeedbackPanel } from '@/components/quiz/FeedbackPanel'
import { QuizResults } from '@/components/quiz/QuizResults'
import exercisesData from '@/data/seed/exercises-pd3m2.json'
import type { Exercise } from '@/types/quiz'
import { GRAMMAR_TOPIC_SLUGS, EXERCISE_TYPE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const allExercises = exercisesData as Exercise[]

const TOPIC_LABELS: Record<string, string> = {
  'noun-gender': 'T-ord og N-ord',
  'comparative-superlative': 'Comparative & Superlative',
  'inverted-word-order': 'Inverted Word Order',
  'main-subordinate-clauses': 'Main & Subordinate Clauses',
  'verbs-tenses': 'Verbs & Tenses',
  'pronouns': 'Pronouns',
}

interface QuizConfig {
  topicSlug: string
  exerciseType: string
}

export function QuizPage() {
  const [searchParams] = useSearchParams()
  const topicFromUrl = searchParams.get('topic') ?? ''

  const [pageMode, setPageMode] = useState<'quiz' | 'list'>('quiz')
  const [config, setConfig] = useState<QuizConfig | null>(null)
  // Pre-select topic from URL query param (e.g. /quiz?topic=noun-gender)
  const initialTopic = GRAMMAR_TOPIC_SLUGS.includes(topicFromUrl as typeof GRAMMAR_TOPIC_SLUGS[number])
    ? topicFromUrl
    : GRAMMAR_TOPIC_SLUGS[0]
  const [key, setKey] = useState(0)

  function getExercises(cfg: QuizConfig): Exercise[] {
    let filtered = allExercises.filter(e => e.grammar_topic_slug === cfg.topicSlug)
    if (cfg.exerciseType !== 'all') {
      filtered = filtered.filter(e => e.exercise_type === cfg.exerciseType)
    }
    return [...filtered].sort(() => Math.random() - 0.5).slice(0, 15)
  }

  function startQuiz(cfg: QuizConfig) {
    setConfig(cfg)
    setKey(k => k + 1)
  }

  function resetQuiz() {
    setConfig(null)
  }

  const modeToggle = (
    <div className="flex rounded-lg border overflow-hidden mb-6">
      <button
        className={cn(
          'flex-1 py-2 text-sm font-medium transition-colors',
          pageMode === 'quiz' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
        )}
        onClick={() => setPageMode('quiz')}
      >
        Quiz
      </button>
      <button
        className={cn(
          'flex-1 py-2 text-sm font-medium transition-colors border-l',
          pageMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
        )}
        onClick={() => setPageMode('list')}
      >
        All Questions
      </button>
    </div>
  )

  // Active quiz — no toggle shown (exit via "Exit quiz" button in flow)
  if (config) {
    const exercises = getExercises(config)
    return (
      <PageContainer key={key}>
        <QuizFlow
          exercises={exercises}
          config={config}
          onReset={resetQuiz}
        />
      </PageContainer>
    )
  }

  if (pageMode === 'list') {
    return (
      <PageContainer>
        {modeToggle}
        <AllQuestionsList />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {modeToggle}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quiz</h1>
        <p className="text-muted-foreground text-sm mt-1">Choose a topic and exercise type</p>
      </div>
      <QuizSelector onStart={startQuiz} initialTopic={initialTopic} />
    </PageContainer>
  )
}

// ─── All Questions List ──────────────────────────────────────────────────────

function AllQuestionsList() {
  const [topicFilter, setTopicFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set())

  const filtered = allExercises.filter(e => {
    const topicMatch = topicFilter === 'all' || e.grammar_topic_slug === topicFilter
    const typeMatch = typeFilter === 'all' || e.exercise_type === typeFilter
    return topicMatch && typeMatch
  })

  function toggleReveal(globalIdx: number) {
    setRevealedIds(prev => {
      const next = new Set(prev)
      if (next.has(globalIdx)) next.delete(globalIdx)
      else next.add(globalIdx)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Topic filter */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Topic</p>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={topicFilter === 'all'} onClick={() => setTopicFilter('all')}>All topics</FilterChip>
          {GRAMMAR_TOPIC_SLUGS.map(slug => (
            <FilterChip key={slug} active={topicFilter === slug} onClick={() => setTopicFilter(slug)}>
              {TOPIC_LABELS[slug]}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Type filter */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</p>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>All types</FilterChip>
          {Object.entries(EXERCISE_TYPE_LABELS).map(([key, label]) => (
            <FilterChip key={key} active={typeFilter === key} onClick={() => setTypeFilter(key)}>
              {label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">{filtered.length} exercises</p>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">
            No exercises match these filters.
          </p>
        ) : (
          filtered.map(exercise => {
            const globalIdx = allExercises.indexOf(exercise)
            const revealed = revealedIds.has(globalIdx)
            return (
              <div key={globalIdx} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-snug flex-1">{exercise.question}</p>
                  <button
                    onClick={() => toggleReveal(globalIdx)}
                    className="shrink-0 text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1 transition-colors"
                  >
                    {revealed ? 'Hide' : 'Answer'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.grammar_topic_slug && (
                    <Badge variant="outline" className="text-xs">
                      {TOPIC_LABELS[exercise.grammar_topic_slug] ?? exercise.grammar_topic_slug}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {EXERCISE_TYPE_LABELS[exercise.exercise_type] ?? exercise.exercise_type}
                  </Badge>
                </div>
                {revealed && (
                  <div className="rounded bg-muted px-3 py-2 text-sm font-medium">
                    {exercise.correct_answer}
                    {exercise.explanation && (
                      <p className="text-xs text-muted-foreground font-normal mt-1">
                        {exercise.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Filter Chip ─────────────────────────────────────────────────────────────

interface FilterChipProps {
  active: boolean
  onClick: () => void
  children: ReactNode
}

function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent'
      )}
    >
      {children}
    </button>
  )
}

// ─── Quiz Selector ─────────────────────────────────────────────────────────────

interface QuizSelectorProps {
  onStart: (config: QuizConfig) => void
  initialTopic?: string
}

function QuizSelector({ onStart, initialTopic = GRAMMAR_TOPIC_SLUGS[0] }: QuizSelectorProps) {
  const [topicSlug, setTopicSlug] = useState<string>(initialTopic)
  const [exerciseType, setExerciseType] = useState('all')

  const availableTypes = ['all', ...Object.keys(EXERCISE_TYPE_LABELS)]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Grammar topic</p>
        <div className="space-y-2">
          {GRAMMAR_TOPIC_SLUGS.map(slug => (
            <button
              key={slug}
              onClick={() => setTopicSlug(slug)}
              className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                topicSlug === slug
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'hover:bg-accent'
              }`}
            >
              {TOPIC_LABELS[slug]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Exercise type</p>
        <div className="flex flex-wrap gap-2">
          {availableTypes.map(type => (
            <button
              key={type}
              onClick={() => setExerciseType(type)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                exerciseType === type
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {type === 'all' ? 'All types' : EXERCISE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        onClick={() => onStart({ topicSlug, exerciseType })}
      >
        Start Quiz
      </Button>
    </div>
  )
}

// ─── Quiz Flow ──────────────────────────────────────────────────────────────

interface QuizFlowProps {
  exercises: Exercise[]
  config: QuizConfig
  onReset: () => void
}

function QuizFlow({ exercises, config, onReset }: QuizFlowProps) {
  const {
    currentExercise,
    currentIndex,
    showFeedback,
    lastResult,
    lastResponse,
    stats,
    progress,
    session,
    submitAnswer,
    nextQuestion,
    isComplete,
  } = useQuiz(exercises, () => {})

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">No exercises found for this combination.</p>
        <Button onClick={onReset} variant="outline">Back to selector</Button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <QuizResults
        session={session}
        stats={stats}
        onRetry={onReset}
      />
    )
  }

  if (!currentExercise) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{TOPIC_LABELS[config.topicSlug]}</Badge>
        </div>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {exercises.length}
        </span>
      </div>

      <Progress value={progress * 100} className="h-1.5" />

      {/* Exercise */}
      {!showFeedback ? (
        renderExercise(currentExercise, submitAnswer)
      ) : (
        lastResult && (
          <FeedbackPanel
            result={lastResult}
            userResponse={lastResponse}
            exercise={currentExercise}
            onNext={nextQuestion}
            isLast={currentIndex === exercises.length - 1}
          />
        )
      )}

      {/* Back button */}
      <button
        onClick={onReset}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        Exit quiz
      </button>
    </div>
  )
}

function renderExercise(exercise: Exercise, onSubmit: (r: string) => void) {
  switch (exercise.exercise_type) {
    case 'type_answer':
      return <TypeAnswer exercise={exercise} onSubmit={onSubmit} />
    case 'cloze':
      return <Cloze exercise={exercise} onSubmit={onSubmit} />
    case 'multiple_choice':
      return <MultipleChoice exercise={exercise} onSubmit={onSubmit} />
    case 'word_order':
      return <WordOrder exercise={exercise} onSubmit={onSubmit} />
    case 'error_correction':
      return <ErrorCorrection exercise={exercise} onSubmit={onSubmit} />
    case 'conjugation':
      return <TypeAnswer exercise={exercise} onSubmit={onSubmit} />
    default:
      return <TypeAnswer exercise={exercise} onSubmit={onSubmit} />
  }
}
