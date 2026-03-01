import { useState } from 'react'
import type { Exercise } from '@/types/quiz'
import { DanishInput } from '@/components/ui/DanishInput'
import { Button } from '@/components/ui/button'

interface ClozeProps {
  exercise: Exercise
  onSubmit: (response: string) => void
  disabled?: boolean
}

export function Cloze({ exercise, onSubmit, disabled }: ClozeProps) {
  const [value, setValue] = useState('')

  // Render question with ___ highlighted
  const parts = exercise.question.split('___')

  function handleSubmit() {
    if (value.trim() === '' || disabled) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium leading-relaxed">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="inline-block border-b-2 border-primary px-1 min-w-[3rem] mx-1 text-primary font-bold">
                {value || '___'}
              </span>
            )}
          </span>
        ))}
      </div>
      {exercise.hint && (
        <p className="text-sm text-muted-foreground italic">Hint: {exercise.hint}</p>
      )}
      <DanishInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder="Fill in the blank…"
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
