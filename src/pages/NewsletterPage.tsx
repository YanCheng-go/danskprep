import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface ReadingSource {
  name: string
  url: string
  description: string
  descriptionDa: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

const SOURCES: ReadingSource[] = [
  {
    name: 'Nyheder på let dansk (DR)',
    url: 'https://www.dr.dk/nyheder/tema/LET',
    description: 'Easy Danish news from Denmark\'s public broadcaster. Simple vocabulary and short sentences.',
    descriptionDa: 'Lette danske nyheder fra Danmarks offentlige tv-station. Simpelt ordforråd og korte sætninger.',
    difficulty: 'beginner',
  },
  {
    name: 'DR Nyheder',
    url: 'https://www.dr.dk/nyheder',
    description: 'Denmark\'s public broadcaster. Free, wide coverage, clear language.',
    descriptionDa: 'Danmarks offentlige tv-station. Gratis, bred dækning, tydeligt sprog.',
    difficulty: 'intermediate',
  },
  {
    name: 'Kristeligt Dagblad',
    url: 'https://www.kristeligt-dagblad.dk',
    description: 'Known for accessible, well-written articles. Good for building reading confidence.',
    descriptionDa: 'Kendt for tilgængelige, velskrevne artikler. God til at opbygge læseselvtillid.',
    difficulty: 'intermediate',
  },
  {
    name: 'Zetland',
    url: 'https://www.zetland.dk',
    description: 'Slow journalism with clear, engaging writing. Subscription-based but high quality.',
    descriptionDa: 'Langsom journalistik med klart, engagerende sprog. Abonnementsbaseret men høj kvalitet.',
    difficulty: 'intermediate',
  },
  {
    name: 'Politiken',
    url: 'https://politiken.dk',
    description: 'Major Danish newspaper. Wide range of topics, more complex vocabulary.',
    descriptionDa: 'Stor dansk avis. Bredt emnespektrum, mere komplekst ordforråd.',
    difficulty: 'advanced',
  },
  {
    name: 'Berlingske',
    url: 'https://www.berlingske.dk',
    description: 'Denmark\'s oldest newspaper. Business, politics, culture. Advanced reading.',
    descriptionDa: 'Danmarks ældste avis. Erhverv, politik, kultur. Avanceret læsning.',
    difficulty: 'advanced',
  },
]

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function NewsletterPage() {
  const { t } = useTranslation()

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('newsletter.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('newsletter.subtitle')}
        </p>
      </div>

      <div className="space-y-3">
        {SOURCES.map(source => (
          <a
            key={source.name}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{source.name}</h3>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {source.description}
                    </p>
                  </div>
                  <Badge className={DIFFICULTY_COLORS[source.difficulty]}>
                    {t(`newsletter.${source.difficulty}`)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        {t('newsletter.tip')}
      </p>
    </PageContainer>
  )
}
