import { useGrammar } from '@/hooks/useGrammar'
import { PageContainer } from '@/components/layout/PageContainer'
import { TopicList } from '@/components/grammar/TopicList'

export function GrammarPage() {
  const { topics } = useGrammar()

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Grammar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Module 2 — {topics.length} topics
        </p>
      </div>
      <TopicList topics={topics} />
    </PageContainer>
  )
}
