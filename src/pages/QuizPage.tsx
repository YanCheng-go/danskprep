import { useState } from 'react'
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
  const [config, setConfig] = useState<QuizConfig | null>(null)
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

  if (!config) {
    return (
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Quiz</h1>
          <p className="text-muted-foreground text-sm mt-1">Choose a topic and exercise type</p>
        </div>
        <QuizSelector onStart={startQuiz} />
      </PageContainer>
    )
  }

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

// ─── Quiz Selector ─────────────────────────────────────────────────────────

interface QuizSelectorProps {
  onStart: (config: QuizConfig) => void
}

function QuizSelector({ onStart }: QuizSelectorProps) {
  const [topicSlug, setTopicSlug] = useState<string>(GRAMMAR_TOPIC_SLUGS[0])
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
    default:
      return <TypeAnswer exercise={exercise} onSubmit={onSubmit} />
  }
}
