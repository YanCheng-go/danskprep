import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { GRAMMAR_TOPIC_SLUGS, SETTINGS_KEYS, DEFAULT_MODULE } from '@/lib/constants'
import { isDuplicateQuestion, addUserExercise } from '@/lib/user-exercises'
import exercisesData from '@/data/seed/exercises-pd3m2.json'
import type { Exercise } from '@/types/quiz'
import type { ExerciseType } from '@/types/database'

const allExercises = exercisesData as Exercise[]

const EXERCISE_TYPES: { value: ExerciseType; label: string }[] = [
  { value: 'cloze', label: 'Fill in blank' },
  { value: 'type_answer', label: 'Type answer' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'error_correction', label: 'Error correction' },
]

const TOPIC_LABELS: Record<string, string> = {
  'noun-gender': 'T-ord og N-ord',
  'comparative-superlative': 'Comparative & Superlative',
  'inverted-word-order': 'Inverted Word Order',
  'main-subordinate-clauses': 'Main & Subordinate Clauses',
  'verbs-tenses': 'Verbs & Tenses',
  'pronouns': 'Pronouns',
  'adjective-agreement': 'Adjective Agreement',
}

const EXERCISE_TEMPLATES: Record<string, string> = {
  cloze: 'Hun ___ (spise) morgenmad hver dag.',
  type_answer: 'Translate: "The car is big"',
  multiple_choice: 'Vælg den rigtige form: Hun har ___ bogen.',
  error_correction: 'Find fejlen: Han spiser ikke morgenmad i går.',
}

interface AddExerciseDialogProps {
  onClose: () => void
}

export function AddExerciseDialog({ onClose }: AddExerciseDialogProps) {
  const [exerciseType, setExerciseType] = useState<ExerciseType>('cloze')
  const [topicSlug, setTopicSlug] = useState<string>(GRAMMAR_TOPIC_SLUGS[0])
  const [question, setQuestion] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [alternatives, setAlternatives] = useState(['', '', ''])
  const [hint, setHint] = useState('')
  const [explanation, setExplanation] = useState('')
  const [shared, setShared] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success'>('idle')

  const activeModule = localStorage.getItem(SETTINGS_KEYS.ACTIVE_MODULE) ?? DEFAULT_MODULE
  const moduleLevel = activeModule === 'pd2' ? 2 : 3

  function checkDuplicate() {
    if (question.length > 10) {
      setDuplicateWarning(isDuplicateQuestion(question, allExercises))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || !correctAnswer.trim()) return

    const filteredAlts = exerciseType === 'multiple_choice'
      ? alternatives.filter(a => a.trim() !== '')
      : null

    addUserExercise({
      exercise_type: exerciseType,
      grammar_topic_slug: topicSlug,
      question: question.trim(),
      correct_answer: correctAnswer.trim(),
      acceptable_answers: [],
      alternatives: filteredAlts,
      hint: hint.trim() || null,
      explanation: explanation.trim() || null,
      module_level: moduleLevel,
      difficulty: 1,
      shared,
    })

    setStatus('success')
    setTimeout(() => onClose(), 1500)
  }

  if (status === 'success') {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Exercise added!</DialogTitle>
          <DialogDescription>
            Your exercise has been saved and will appear in quiz and drill sessions.
          </DialogDescription>
        </DialogHeader>
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Exercise</DialogTitle>
        <DialogDescription>
          Add exercises from your exam papers or homework. Do not copy textbook content.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
        {/* Exercise type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Exercise type</label>
          <div className="flex flex-wrap gap-2">
            {EXERCISE_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setExerciseType(t.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  exerciseType === t.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grammar topic */}
        <div className="space-y-2">
          <label htmlFor="add-topic" className="text-sm font-medium">Grammar topic</label>
          <select
            id="add-topic"
            value={topicSlug}
            onChange={e => setTopicSlug(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {GRAMMAR_TOPIC_SLUGS.map(slug => (
              <option key={slug} value={slug}>{TOPIC_LABELS[slug]}</option>
            ))}
          </select>
        </div>

        {/* Template hint */}
        <div className="rounded-md bg-muted px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Example: <code className="font-mono">{EXERCISE_TEMPLATES[exerciseType]}</code>
          </p>
        </div>

        {/* Question */}
        <div className="space-y-2">
          <label htmlFor="add-question" className="text-sm font-medium">Question</label>
          <textarea
            id="add-question"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onBlur={checkDuplicate}
            placeholder="Enter the question or prompt..."
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            required
          />
          {duplicateWarning && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              This question looks similar to an existing exercise.
            </p>
          )}
        </div>

        {/* Correct answer */}
        <div className="space-y-2">
          <label htmlFor="add-answer" className="text-sm font-medium">Correct answer</label>
          <Input
            id="add-answer"
            value={correctAnswer}
            onChange={e => setCorrectAnswer(e.target.value)}
            placeholder="The correct answer..."
            required
          />
        </div>

        {/* MC alternatives */}
        {exerciseType === 'multiple_choice' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Wrong alternatives (for MC)</label>
            {alternatives.map((alt, i) => (
              <Input
                key={i}
                value={alt}
                onChange={e => {
                  const next = [...alternatives]
                  next[i] = e.target.value
                  setAlternatives(next)
                }}
                placeholder={`Wrong option ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Hint */}
        <div className="space-y-2">
          <label htmlFor="add-hint" className="text-sm font-medium">
            Hint <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input
            id="add-hint"
            value={hint}
            onChange={e => setHint(e.target.value)}
            placeholder="A hint to help the user..."
          />
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <label htmlFor="add-explanation" className="text-sm font-medium">
            Explanation <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input
            id="add-explanation"
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            placeholder="Why this is the correct answer..."
          />
        </div>

        {/* Share toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={shared}
            onChange={e => setShared(e.target.checked)}
            className="h-4 w-4"
          />
          <div>
            <span className="text-sm">Share publicly</span>
            <p className="text-xs text-muted-foreground">
              Other users will see this exercise in their quiz pool
            </p>
          </div>
        </label>

        {/* Module tag */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Tagged as:</span>
          <Badge variant="secondary" className="text-xs">{activeModule.toUpperCase()}</Badge>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={!question.trim() || !correctAnswer.trim()}>
          Add exercise
        </Button>
      </DialogFooter>
    </form>
  )
}
