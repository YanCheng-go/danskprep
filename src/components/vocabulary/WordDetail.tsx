import type { Word } from '@/types/database'
import { ExampleBlock } from '@/components/grammar/ExampleBlock'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface WordDetailProps {
  word: Word
}

export function WordDetail({ word }: WordDetailProps) {
  const inflections = word.inflections as Record<string, string | string[]> | null

  return (
    <div className="space-y-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xl font-bold">
            {word.part_of_speech === 'verb'
              ? `at ${word.danish}`
              : word.gender
                ? `${word.gender} ${word.danish}`
                : word.danish}
          </p>
          <p className="text-muted-foreground">{word.english}</p>
        </div>
        <Badge variant="outline">{word.part_of_speech}</Badge>
      </div>

      {inflections && Object.keys(inflections).length > 0 && (
        <>
          <Separator />
          <InflectionSection word={word} inflections={inflections} />
        </>
      )}

      {word.example_da && word.example_en && (
        <>
          <Separator />
          <ExampleBlock danish={word.example_da} english={word.example_en} />
        </>
      )}

      {word.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {word.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── POS-specific inflection rendering ──────────────────────────────────────

interface InflectionSectionProps {
  word: Word
  inflections: Record<string, string | string[]>
}

function InflectionSection({ word, inflections }: InflectionSectionProps) {
  if (word.part_of_speech === 'verb') {
    return <VerbTable inflections={inflections} infinitive={word.danish} />
  }
  if (word.part_of_speech === 'adjective') {
    return <AdjectiveTable inflections={inflections} base={word.danish} />
  }
  if (word.part_of_speech === 'noun') {
    return <NounTable inflections={inflections} base={word.danish} />
  }
  return <GenericInflectionGrid inflections={inflections} />
}

// ─── Verb conjugation table ──────────────────────────────────────────────────

interface VerbTableProps {
  inflections: Record<string, string | string[]>
  infinitive: string
}

function VerbTable({ inflections, infinitive }: VerbTableProps) {
  const rows: { label: string; sublabel: string; value: string | string[] | undefined }[] = [
    { label: 'Infinitiv', sublabel: 'infinitive', value: `at ${infinitive}` },
    { label: 'Nutid', sublabel: 'present', value: inflections['present'] },
    { label: 'Datid', sublabel: 'past', value: inflections['past'] },
    { label: 'Førnutid', sublabel: 'perfect', value: inflections['perfect'] },
    { label: 'Bydeform', sublabel: 'imperative', value: inflections['imperative'] },
  ]

  return <InflectionTable rows={rows} />
}

// ─── Adjective forms table ────────────────────────────────────────────────────

interface AdjectiveTableProps {
  inflections: Record<string, string | string[]>
  base: string
}

function AdjectiveTable({ inflections, base }: AdjectiveTableProps) {
  const rows: { label: string; sublabel: string; value: string | string[] | undefined }[] = [
    { label: 'Grundform', sublabel: 'en-noun', value: base },
    { label: 'T-form', sublabel: 'et-noun', value: inflections['t_form'] },
    { label: 'E-form', sublabel: 'definite/pl.', value: inflections['e_form'] },
    { label: 'Komparativ', sublabel: 'comparative', value: inflections['comparative'] },
    { label: 'Superlativ', sublabel: 'superlative', value: inflections['superlative'] },
  ]

  return <InflectionTable rows={rows} />
}

// ─── Noun inflection table ────────────────────────────────────────────────────

interface NounTableProps {
  inflections: Record<string, string | string[]>
  base: string
}

function NounTable({ inflections, base }: NounTableProps) {
  const rows: { label: string; sublabel: string; value: string | string[] | undefined }[] = [
    { label: 'Ubestemt', sublabel: 'indefinite', value: base },
    { label: 'Bestemt', sublabel: 'definite', value: inflections['definite'] },
    { label: 'Flertal', sublabel: 'plural', value: inflections['plural_indef'] },
    { label: 'Flertal best.', sublabel: 'plural def.', value: inflections['plural_def'] },
  ]

  return <InflectionTable rows={rows} />
}

// ─── Shared table renderer ────────────────────────────────────────────────────

interface InflectionRow {
  label: string
  sublabel: string
  value: string | string[] | undefined
}

function InflectionTable({ rows }: { rows: InflectionRow[] }) {
  const visible = rows.filter(r => r.value !== undefined && r.value !== null && r.value !== '')
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Bøjning
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {visible.map(row => (
              <tr key={row.label} className="border-b last:border-0">
                <td className="py-1.5 pr-4 w-32 align-top">
                  <span className="font-medium text-foreground">{row.label}</span>
                  <span className="text-xs text-muted-foreground ml-1">({row.sublabel})</span>
                </td>
                <td className="py-1.5 font-medium">
                  {Array.isArray(row.value) ? row.value.join(', ') : String(row.value ?? '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Generic fallback ────────────────────────────────────────────────────────

function GenericInflectionGrid({ inflections }: { inflections: Record<string, string | string[]> }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Bøjning
      </p>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(inflections).map(([key, val]) => (
          <div key={key} className="text-sm">
            <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
            <span className="font-medium">
              {Array.isArray(val) ? val.join(', ') : val}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
