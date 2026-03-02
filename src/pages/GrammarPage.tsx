import { useGrammar } from '@/hooks/useGrammar'
import { useTranslation } from '@/lib/i18n'
import { PageContainer } from '@/components/layout/PageContainer'
import { TopicList } from '@/components/grammar/TopicList'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, ExternalLink } from 'lucide-react'

const GRAMMAR_PDF_URL = 'https://dn790008.ca.archive.org/0/items/DanishGrammar/Danish%20Grammar.pdf'

export function GrammarPage() {
  const { topics } = useGrammar()
  const { t } = useTranslation()

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('grammar.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('grammar.topicCount', { count: topics.length })}
        </p>
      </div>
      <TopicList topics={topics} />
      <Card className="mt-6">
        <CardContent className="pt-4 pb-4">
          <a
            href={GRAMMAR_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 group"
          >
            <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium group-hover:underline">{t('grammar.pdfReference')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('grammar.pdfDescription')}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          </a>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
