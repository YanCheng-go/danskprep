import type { ReviewableCard } from '@/types/study'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FlashCardProps {
  card: ReviewableCard
  onReveal: () => void
  revealed: boolean
}

export function FlashCard({ card, onReveal, revealed }: FlashCardProps) {
  const { content } = card

  return (
    <div className="space-y-4">
      {/* Front */}
      <Card>
        <CardContent className="p-6 text-center min-h-[140px] flex flex-col items-center justify-center gap-3">
          <p className="text-lg font-medium leading-relaxed">{content.front}</p>
          {content.hint && !revealed && (
            <p className="text-sm text-muted-foreground italic">Hint: {content.hint}</p>
          )}
        </CardContent>
      </Card>

      {/* Back (revealed) */}
      {revealed ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 text-center min-h-[100px] flex flex-col items-center justify-center gap-2">
            <p className="text-lg font-semibold text-primary">{content.back}</p>
            {content.explanation && (
              <p className="text-sm text-muted-foreground mt-1">{content.explanation}</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full h-14 text-base"
          onClick={onReveal}
        >
          Show answer
        </Button>
      )}
    </div>
  )
}
