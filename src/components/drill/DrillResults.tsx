import { Link } from 'react-router-dom'
import type { DrillSession, DrillStats, DrillRoundType } from '@/types/drill'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { DRILL_ROUND_TYPE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface DrillResultsProps {
  session: DrillSession
  stats: DrillStats
  onRetry: () => void
}

export function DrillResults({ session, stats, onRetry }: DrillResultsProps) {
  const retryCount = stats.retriesPassed + stats.retriesFailed

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">
          {stats.accuracyPercent >= 80 ? '🎉' : stats.accuracyPercent >= 50 ? '👍' : '💪'}
        </div>
        <h2 className="text-2xl font-bold">Drill Complete!</h2>
        <p className="text-muted-foreground text-sm">
          {stats.correct} / {stats.total} correct
        </p>
      </div>

      {/* Accuracy bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Accuracy</span>
          <span className="font-semibold">{stats.accuracyPercent}%</span>
        </div>
        <Progress value={stats.accuracyPercent} className="h-3" />
      </div>

      {/* Stats breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.correct}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.almostCorrect}</p>
            <p className="text-xs text-muted-foreground">Almost</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.incorrect}</p>
            <p className="text-xs text-muted-foreground">Incorrect</p>
          </CardContent>
        </Card>
      </div>

      {/* Re-test stats */}
      {retryCount > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-1">Adaptive re-test</p>
            <p className="text-sm text-muted-foreground">
              {stats.retriesPassed} of {retryCount} words recovered after re-test
            </p>
          </CardContent>
        </Card>
      )}

      {/* By round type */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">By round type</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.entries(stats.byRoundType) as [DrillRoundType, { total: number; correct: number }][])
            .filter(([, v]) => v.total > 0)
            .map(([rt, v]) => (
              <Card key={rt}>
                <CardContent className="p-3 space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {DRILL_ROUND_TYPE_LABELS[rt]}
                  </Badge>
                  <p className="text-sm font-medium">
                    {v.correct}/{v.total}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0}%)
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Missed answers review */}
      {session.answers.filter(a => !a.result.isCorrect).length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Review missed answers:</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {session.answers
              .filter(a => !a.result.isCorrect)
              .map((answer, i) => (
                <div key={i} className="rounded-md border px-3 py-2 text-sm space-y-1">
                  <p className="text-muted-foreground">{answer.question.prompt}</p>
                  <p>
                    <span className="text-destructive line-through mr-2">{answer.userResponse || '(empty)'}</span>
                    <span className="font-medium text-green-600">{answer.question.correctAnswer}</span>
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onRetry} variant="outline" className="flex-1">
          Try again
        </Button>
        <Link to="/home" className={cn(buttonVariants(), 'flex-1 justify-center')}>
          Done
        </Link>
      </div>
    </div>
  )
}
