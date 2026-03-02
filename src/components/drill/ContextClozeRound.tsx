import { useState } from 'react'
import type { DrillQuestion } from '@/types/drill'
import { DanishInput } from '@/components/ui/DanishInput'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'

interface ContextClozeRoundProps {
  question: DrillQuestion
  onSubmit: (response: string) => void
  disabled?: boolean
}

export function ContextClozeRound({ question, onSubmit, disabled }: ContextClozeRoundProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  const parts = question.prompt.split('___')

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
      {question.hint && (
        <p className="text-sm text-muted-foreground italic">{t('common.hint')} {question.hint}</p>
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
        {t('quiz.checkAnswer')}
      </Button>
      {!disabled && (
        <Button
          variant="ghost"
          onClick={() => { onSubmit(''); setValue('') }}
          className="w-full text-muted-foreground"
        >
          {t('quiz.dontKnow')}
        </Button>
      )}
    </div>
  )
}
