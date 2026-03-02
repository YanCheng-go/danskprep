import { useState } from 'react'
import type { DrillQuestion } from '@/types/drill'
import { DanishInput } from '@/components/ui/DanishInput'
import { Button } from '@/components/ui/button'
import { getInflectionLabels } from '@/lib/drill-engine'
import { useTranslation } from '@/lib/i18n'

interface ParadigmRoundProps {
  question: DrillQuestion
  onSubmit: (response: string) => void
  disabled?: boolean
}

export function ParadigmRound({ question, onSubmit, disabled }: ParadigmRoundProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const word = question.word
  const labels = getInflectionLabels(word.part_of_speech)

  // Build the header
  const header = word.part_of_speech === 'noun' && word.gender
    ? `${word.gender} ${word.danish} (${word.english})`
    : word.part_of_speech === 'verb'
    ? `at ${word.danish} (${word.english})`
    : `${word.danish} (${word.english})`

  // Build table rows from inflections
  const inflections = word.inflections ?? {}
  const rows = Object.entries(inflections)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '')
    .map(([key, val]) => ({
      label: labels[key] ?? key,
      value: val,
      isTested: key === question.inflectionKey,
    }))

  function handleSubmit() {
    if (value.trim() === '' || disabled) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-medium text-lg">{header}</p>
        <p className="text-sm text-muted-foreground">{t('drill.fillMissing')}</p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={row.isTested
                  ? 'bg-primary/5 dark:bg-primary/10'
                  : i % 2 === 0 ? 'bg-muted/30' : ''
                }
              >
                <td className="px-4 py-2.5 font-medium text-muted-foreground w-1/3">
                  {row.label}
                </td>
                <td className="px-4 py-2.5">
                  {row.isTested ? (
                    <span className="text-primary font-bold">___</span>
                  ) : (
                    <span className="font-mono">{row.value}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DanishInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder={`Type the ${rows.find(r => r.isTested)?.label ?? 'missing'} form…`}
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
