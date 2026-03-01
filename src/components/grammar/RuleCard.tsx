import type { GrammarRule } from '@/types/grammar'
import { ExampleBlock } from './ExampleBlock'

interface RuleCardProps {
  rule: GrammarRule
  index: number
}

export function RuleCard({ rule, index }: RuleCardProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        <span className="text-muted-foreground mr-2">{index + 1}.</span>
        {rule.rule}
      </p>
      <ExampleBlock danish={rule.example_da} english={rule.example_en} />
    </div>
  )
}
