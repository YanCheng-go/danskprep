import { Link } from 'react-router-dom'
import { ChevronLeft, AlertCircle, Lightbulb } from 'lucide-react'
import type { GrammarTopic } from '@/types/grammar'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RuleCard } from './RuleCard'
import { cn } from '@/lib/utils'

interface TopicDetailProps {
  topic: GrammarTopic
}

export function TopicDetail({ topic }: TopicDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/grammar"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Grammar
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{topic.title}</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">{topic.explanation}</p>
      </div>

      <Separator />

      {/* Rules */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Rules</h2>
        <div className="space-y-4">
          {topic.rules.map((rule, i) => (
            <RuleCard key={i} rule={rule} index={i} />
          ))}
        </div>
      </section>

      {/* Tips */}
      {topic.tips.length > 0 && (
        <>
          <Separator />
          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Tips
            </h2>
            <ul className="space-y-2">
              {topic.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* Common mistakes */}
      {topic.common_mistakes.length > 0 && (
        <>
          <Separator />
          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Common Mistakes
            </h2>
            <ul className="space-y-2">
              {topic.common_mistakes.map((mistake, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
