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
            {word.gender ? `${word.gender} ` : ''}{word.danish}
          </p>
          <p className="text-muted-foreground">{word.english}</p>
        </div>
        <Badge variant="outline">{word.part_of_speech}</Badge>
      </div>

      {inflections && Object.keys(inflections).length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Inflections
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
