import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

const EXERCISE_FEEDBACK_TYPES = [
  'Wrong answer marked correct',
  'Correct answer marked wrong',
  'Unclear question',
  'Wrong explanation',
  'Content suggestion',
] as const

const GENERAL_FEEDBACK_TYPES = [
  'Bug report',
  'Feature request',
  'Content suggestion',
  'Other',
] as const

const MAX_MESSAGE_LENGTH = 500

interface FeedbackDialogProps {
  exerciseId?: string
  onClose: () => void
}

export function FeedbackDialog({ exerciseId, onClose }: FeedbackDialogProps) {
  const { user } = useAuth()
  const isExerciseFeedback = !!exerciseId
  const feedbackTypes = isExerciseFeedback ? EXERCISE_FEEDBACK_TYPES : GENERAL_FEEDBACK_TYPES
  const [type, setType] = useState<string>(feedbackTypes[0])
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    setStatus('submitting')

    if (!supabase) {
      setStatus('error')
      return
    }

    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      exercise_id: exerciseId ?? null,
      type,
      message: message.trim(),
    })

    if (error) {
      setStatus('error')
      return
    }

    setStatus('success')
    setTimeout(() => onClose(), 1500)
  }

  if (status === 'success') {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Thanks for your feedback!</DialogTitle>
          <DialogDescription>
            We&apos;ll review it and use it to improve the app.
          </DialogDescription>
        </DialogHeader>
      </>
    )
  }

  const mailtoSubject = encodeURIComponent(`[DanskPrep Feedback] ${type}`)
  const mailtoBody = encodeURIComponent(
    `Exercise: ${exerciseId ?? 'General'}\nType: ${type}\n\n${message}`
  )

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>
          {isExerciseFeedback ? 'Report a problem' : 'Send feedback'}
        </DialogTitle>
        <DialogDescription>
          {isExerciseFeedback
            ? 'Something wrong with this exercise? Let us know so we can fix it.'
            : 'Have a suggestion, found a bug, or want to request a feature?'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {isExerciseFeedback && (
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Exercise ID: <code className="font-mono">{exerciseId}</code>
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="feedback-type" className="text-sm font-medium">
            What kind of feedback?
          </label>
          <select
            id="feedback-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {feedbackTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="feedback-message" className="text-sm font-medium">
            Tell us more
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) =>
              setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))
            }
            placeholder={
              isExerciseFeedback
                ? 'What was wrong? What should the correct answer be?'
                : 'Describe your suggestion or the issue you found...'
            }
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            required
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length} / {MAX_MESSAGE_LENGTH}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          This app covers PD2, PD3M1, PD3M2 exam content only. Suggestions
          outside that scope will not be acted on.
        </p>

        {status === 'error' && (
          <p className="text-sm text-destructive">
            Failed to submit via database.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Or{' '}
          <a
            href={`mailto:chengyan2017@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`}
            className="underline hover:text-foreground transition-colors"
          >
            send feedback via email
          </a>
        </p>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={!message.trim() || status === 'submitting'}>
          {status === 'submitting' ? 'Sending...' : 'Send feedback'}
        </Button>
      </DialogFooter>
    </form>
  )
}
