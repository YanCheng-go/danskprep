import { useState } from 'react'
import type { DrillQuestion } from '@/types/drill'
import { DanishInput } from '@/components/ui/DanishInput'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'

interface TranslationRoundProps {
  question: DrillQuestion
  onSubmit: (response: string) => void
  disabled?: boolean
}

export function TranslationRound({ question, onSubmit, disabled }: TranslationRoundProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const isDanishTarget = question.roundType === 'translation_en_da'

  function handleSubmit() {
    if (value.trim() === '' || disabled) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <div className="space-y-4">
      <p className="font-medium leading-relaxed">{question.prompt}</p>
      {question.hint && (
        <p className="text-sm text-muted-foreground italic">{t('common.hint')} {question.hint}</p>
      )}
      {isDanishTarget ? (
        <DanishInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          autoFocus
          disabled={disabled}
        />
      ) : (
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Type your answer…"
          autoFocus
          disabled={disabled}
          className="text-base"
        />
      )}
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
