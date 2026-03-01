import { Link } from 'react-router-dom'
import type { QuizSession, QuizStats } from '@/types/quiz'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface QuizResultsProps {
  session: QuizSession
  stats: QuizStats
  onRetry: () => void
}

export function QuizResults({ session, stats, onRetry }: QuizResultsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">
          {stats.accuracyPercent >= 80 ? '🎉' : stats.accuracyPercent >= 50 ? '👍' : '💪'}
        </div>
        <h2 className="text-2xl font-bold">Quiz Complete!</h2>
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

      {/* Missed answers review */}
      {session.answers.filter(a => !a.result.isCorrect).length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Review missed answers:</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {session.answers
              .filter(a => !a.result.isCorrect)
              .map((answer, i) => (
                <div key={i} className="rounded-md border px-3 py-2 text-sm space-y-1">
                  <p className="text-muted-foreground">{answer.exercise.question}</p>
                  <p>
                    <span className="text-destructive line-through mr-2">{answer.userResponse || '(empty)'}</span>
                    <span className="font-medium text-green-600">{answer.exercise.correct_answer}</span>
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
        <Link to="/" className={cn(buttonVariants(), 'flex-1 justify-center')}>
          Done
        </Link>
      </div>
    </div>
  )
}
