import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { GrammarTopic } from '@/types/grammar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TopicListProps {
  topics: GrammarTopic[]
}

const CATEGORY_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  nouns: 'default',
  adjectives: 'secondary',
  verbs: 'default',
  pronouns: 'secondary',
  syntax: 'outline',
}

export function TopicList({ topics }: TopicListProps) {
  return (
    <div className="space-y-3">
      {topics.map(topic => (
        <Link key={topic.slug} to={`/grammar/${topic.slug}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between py-4 px-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm leading-tight">{topic.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={CATEGORY_COLORS[topic.category] ?? 'outline'}>
                    {topic.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {topic.rules.length} rules
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
