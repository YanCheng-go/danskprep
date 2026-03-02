import { useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import wordsData from '@/data/seed/words-pd3m2.json'
import type { Word } from '@/types/database'
import type { DrillConfig, DrillRoundType, DrillQuestion } from '@/types/drill'
import { buildDrillSession } from '@/lib/drill-engine'
import { useDrill } from '@/hooks/useDrill'
import { PageContainer } from '@/components/layout/PageContainer'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TranslationRound } from '@/components/drill/TranslationRound'
import { ContextClozeRound } from '@/components/drill/ContextClozeRound'
import { ParadigmRound } from '@/components/drill/ParadigmRound'
import { FormChoiceRound } from '@/components/drill/FormChoiceRound'
import { DrillResults } from '@/components/drill/DrillResults'
import { FeedbackPanel } from '@/components/quiz/FeedbackPanel'
import { DRILL_ROUND_TYPE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { FeedbackButton } from '@/components/feedback/FeedbackButton'
import type { Exercise } from '@/types/quiz'
import { useTranslation } from '@/lib/i18n'

// ─── Load words ─────────────────────────────────────────────────────────────

type SeedWord = Omit<Word, 'id' | 'created_at'> & { id?: string; created_at?: string }
const allWords = (wordsData as SeedWord[]).map((w, i) => ({
  ...w,
  id: w.id ?? `local-word-${i}`,
  created_at: w.created_at ?? new Date().toISOString(),
})) as Word[]

// ─── Drill Page ─────────────────────────────────────────────────────────────

export function DrillPage() {
  const [config, setConfig] = useState<DrillConfig | null>(null)
  const [key, setKey] = useState(0)
  const { t } = useTranslation()

  function startDrill(cfg: DrillConfig) {
    setConfig(cfg)
    setKey(k => k + 1)
  }

  function resetDrill() {
    setConfig(null)
  }

  if (config) {
    const questions = buildDrillSession(allWords, config)
    return (
      <PageContainer key={key}>
        <DrillFlow questions={questions} onReset={resetDrill} />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('drill.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('drill.subtitle')}
        </p>
      </div>
      <DrillSelector onStart={startDrill} />
    </PageContainer>
  )
}

// ─── Drill Selector ─────────────────────────────────────────────────────────

const POS_OPTIONS: { value: 'noun' | 'verb' | 'adjective'; labelKey: string }[] = [
  { value: 'noun', labelKey: 'vocab.nouns' },
  { value: 'verb', labelKey: 'vocab.verbs' },
  { value: 'adjective', labelKey: 'vocab.adjectives' },
]

const ROUND_TYPE_OPTIONS: { value: DrillRoundType; label: string }[] = [
  { value: 'translation_en_da', label: DRILL_ROUND_TYPE_LABELS.translation_en_da },
  { value: 'translation_da_en', label: DRILL_ROUND_TYPE_LABELS.translation_da_en },
  { value: 'context_cloze', label: DRILL_ROUND_TYPE_LABELS.context_cloze },
  { value: 'paradigm_fill', label: DRILL_ROUND_TYPE_LABELS.paradigm_fill },
  { value: 'form_choice', label: DRILL_ROUND_TYPE_LABELS.form_choice },
]

const SESSION_LENGTHS = [10, 15, 20, 30, 0] as const  // 0 = all

interface DrillSelectorProps {
  onStart: (config: DrillConfig) => void
}

function DrillSelector({ onStart }: DrillSelectorProps) {
  const [posFilter, setPosFilter] = useState<('noun' | 'verb' | 'adjective')[]>([])
  const [roundTypes, setRoundTypes] = useState<DrillRoundType[]>([])
  const [questionCount, setQuestionCount] = useState<number>(20)
  const { t } = useTranslation()

  // Count eligible words
  const eligibleCount = useMemo(() => {
    const posSet = posFilter.length > 0 ? posFilter : POS_OPTIONS.map(p => p.value)
    return allWords.filter(w => (posSet as string[]).includes(w.part_of_speech)).length
  }, [posFilter])

  function togglePos(pos: 'noun' | 'verb' | 'adjective') {
    setPosFilter(prev =>
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    )
  }

  function toggleRoundType(rt: DrillRoundType) {
    setRoundTypes(prev =>
      prev.includes(rt) ? prev.filter(r => r !== rt) : [...prev, rt]
    )
  }

  return (
    <div className="space-y-6">
      {/* POS filter */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t('drill.wordType')}</p>
        <p className="text-xs text-muted-foreground">{t('drill.wordTypeHint')}</p>
        <div className="flex flex-wrap gap-2">
          {POS_OPTIONS.map(opt => (
            <FilterChip
              key={opt.value}
              active={posFilter.includes(opt.value)}
              onClick={() => togglePos(opt.value)}
            >
              {t(opt.labelKey)}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Round type filter */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t('drill.drillTypes')}</p>
        <p className="text-xs text-muted-foreground">{t('drill.wordTypeHint')}</p>
        <div className="flex flex-wrap gap-2">
          {ROUND_TYPE_OPTIONS.map(opt => (
            <FilterChip
              key={opt.value}
              active={roundTypes.includes(opt.value)}
              onClick={() => toggleRoundType(opt.value)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Session length */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t('drill.sessionLength')}</p>
        <div className="flex flex-wrap gap-2">
          {SESSION_LENGTHS.map(n => (
            <FilterChip
              key={n}
              active={questionCount === n}
              onClick={() => setQuestionCount(n)}
            >
              {n === 0 ? t('drill.allCount', { count: eligibleCount }) : t('drill.questions', { count: n })}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Word count preview */}
      <p className="text-sm text-muted-foreground">
        {t('drill.wordsAvailable', { count: eligibleCount })}
      </p>

      <Button
        className="w-full"
        onClick={() => onStart({ posFilter, roundTypes, questionCount: questionCount === 0 ? eligibleCount : questionCount })}
        disabled={eligibleCount === 0}
      >
        {t('drill.start')}
      </Button>
    </div>
  )
}

// ─── Filter Chip ────────────────────────────────────────────────────────────

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

// ─── Drill Flow ─────────────────────────────────────────────────────────────

interface DrillFlowProps {
  questions: DrillQuestion[]
  onReset: () => void
}

function DrillFlow({ questions, onReset }: DrillFlowProps) {
  const { t } = useTranslation()
  const {
    currentQuestion,
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
    totalQuestions,
  } = useDrill(questions)

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">{t('drill.noQuestions')}</p>
        <Button onClick={onReset} variant="outline">{t('quiz.backToSelector')}</Button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <DrillResults
        session={session}
        stats={stats}
        onRetry={onReset}
      />
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge variant="outline">
          {DRILL_ROUND_TYPE_LABELS[currentQuestion.roundType]}
        </Badge>
        <div className="flex items-center gap-2">
          <FeedbackButton exerciseId={currentQuestion.word.id ?? `drill-${currentIndex}`} />
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {totalQuestions}
          </span>
        </div>
      </div>

      <Progress value={progress * 100} className="h-1.5" />

      {/* Question */}
      {!showFeedback ? (
        renderDrillQuestion(currentQuestion, submitAnswer)
      ) : (
        lastResult && (
          <FeedbackPanel
            result={lastResult}
            userResponse={lastResponse}
            exercise={asFeedbackExercise(currentQuestion)}
            onNext={nextQuestion}
            isLast={currentIndex === totalQuestions - 1}
          />
        )
      )}

      {/* Exit button */}
      <button
        onClick={onReset}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        {t('drill.exit')}
      </button>
    </div>
  )
}

// ─── Question renderer ──────────────────────────────────────────────────────

function renderDrillQuestion(question: DrillQuestion, onSubmit: (r: string) => void) {
  switch (question.roundType) {
    case 'translation_en_da':
    case 'translation_da_en':
      return <TranslationRound question={question} onSubmit={onSubmit} />
    case 'context_cloze':
      return <ContextClozeRound question={question} onSubmit={onSubmit} />
    case 'paradigm_fill':
      return <ParadigmRound question={question} onSubmit={onSubmit} />
    case 'form_choice':
      return <FormChoiceRound question={question} onSubmit={onSubmit} />
  }
}

// ─── FeedbackPanel adapter ──────────────────────────────────────────────────

function asFeedbackExercise(q: DrillQuestion): Exercise {
  return {
    exercise_type: 'type_answer',
    question: q.prompt,
    correct_answer: q.correctAnswer,
    acceptable_answers: q.acceptableAnswers,
    explanation: q.explanation ?? null,
    grammar_topic_slug: null,
    alternatives: q.alternatives ?? null,
    hint: q.hint ?? null,
    module_level: 2,
    difficulty: 1,
  }
}
