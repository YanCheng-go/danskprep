import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { WritingScore } from '@/lib/ai-scoring'

interface WritingFeedbackProps {
  score: WritingScore
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const percent = (value / 5) * 100
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}/5</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function WritingFeedback({ score }: WritingFeedbackProps) {
  return (
    <div className="space-y-4">
      {/* Overall score */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Score</h3>
            <Badge
              variant={score.overall >= 4 ? 'default' : score.overall >= 3 ? 'secondary' : 'destructive'}
              className="text-lg px-3 py-1"
            >
              {score.overall}/5
            </Badge>
          </div>
          <div className="space-y-3">
            <ScoreBar label="Grammar" value={score.grammar} />
            <ScoreBar label="Vocabulary" value={score.vocabulary} />
            <ScoreBar label="Task completion" value={score.taskCompletion} />
          </div>
        </CardContent>
      </Card>

      {/* Corrections */}
      {score.corrections.length > 0 && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <h3 className="text-sm font-semibold">Corrections</h3>
            {score.corrections.map((c, i) => (
              <div key={i} className="rounded-md border p-3 space-y-1">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-red-500 line-through">{c.original}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">{c.corrected}</span>
                </div>
                <p className="text-xs text-muted-foreground">{c.explanation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* General feedback */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold mb-2">Feedback</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{score.feedback}</p>
        </CardContent>
      </Card>
    </div>
  )
}
