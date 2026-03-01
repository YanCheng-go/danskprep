import { useState } from 'react'
import type { Exercise } from '@/types/quiz'
import { DanishInput } from '@/components/ui/DanishInput'
import { Button } from '@/components/ui/button'

interface TypeAnswerProps {
  exercise: Exercise
  onSubmit: (response: string) => void
  disabled?: boolean
}

export function TypeAnswer({ exercise, onSubmit, disabled }: TypeAnswerProps) {
  const [value, setValue] = useState('')

  function handleSubmit() {
    if (value.trim() === '' || disabled) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <div className="space-y-4">
      <p className="font-medium leading-relaxed">{exercise.question}</p>
      {exercise.hint && (
        <p className="text-sm text-muted-foreground italic">Hint: {exercise.hint}</p>
      )}
      <DanishInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        autoFocus
        disabled={disabled}
      />
      <Button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className="w-full"
      >
        Check answer
      </Button>
    </div>
  )
}
