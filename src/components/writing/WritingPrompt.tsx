import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface WritingPromptData {
  id: string
  title: string
  prompt: string
  prompt_en: string
  tips: string[]
  min_words: number
  max_words: number
}

interface WritingPromptProps {
  prompt: WritingPromptData
}

export function WritingPrompt({ prompt }: WritingPromptProps) {
  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{prompt.title}</h2>
          <p className="text-sm mt-2">{prompt.prompt}</p>
          <p className="text-sm text-muted-foreground mt-1 italic">{prompt.prompt_en}</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {prompt.min_words}–{prompt.max_words} words
          </Badge>
        </div>

        {prompt.tips.length > 0 && (
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Grammar tips:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {prompt.tips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export type { WritingPromptData }
