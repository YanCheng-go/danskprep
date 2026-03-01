import { useParams, Navigate } from 'react-router-dom'
import { useGrammar } from '@/hooks/useGrammar'
import { PageContainer } from '@/components/layout/PageContainer'
import { TopicDetail } from '@/components/grammar/TopicDetail'
import { Skeleton } from '@/components/ui/skeleton'

export function GrammarTopicPage() {
  const { slug } = useParams<{ slug: string }>()
  const { getTopic } = useGrammar()

  if (!slug) return <Navigate to="/grammar" replace />

  const topic = getTopic(slug)

  if (!topic) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <TopicDetail topic={topic} />
    </PageContainer>
  )
}
