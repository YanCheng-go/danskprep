import { useState } from 'react'
import type { Exercise } from '@/types/quiz'
import { DanishInput } from '@/components/ui/DanishInput'
import { Button } from '@/components/ui/button'

interface ErrorCorrectionProps {
  exercise: Exercise
  onSubmit: (response: string) => void
  disabled?: boolean
}

export function ErrorCorrection({ exercise, onSubmit, disabled }: ErrorCorrectionProps) {
  const [value, setValue] = useState('')

  function handleSubmit() {
    if (value.trim() === '' || disabled) return
    onSubmit(value.trim())
    setValue('')
  }

  // Extract the erroneous sentence from the question
  const match = exercise.question.match(/'(.+)'/)
  const badSentence = match?.[1] ?? exercise.question

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Fix the grammatical error:</p>
        <div className="rounded-md bg-muted px-4 py-3 font-medium">
          {badSentence}
        </div>
      </div>
      {exercise.hint && (
        <p className="text-sm text-muted-foreground italic">Hint: {exercise.hint}</p>
      )}
      <DanishInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder="Type the corrected sentence…"
        autoFocus
        disabled={disabled}
      />
      <Button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className="w-full"
      >
        Submit correction
      </Button>
    </div>
  )
}
