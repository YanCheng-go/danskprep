import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export function ModultestPage() {
  const { t } = useTranslation()

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('modultest.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('modultest.subtitle')}
        </p>
      </div>

      <a
        href="https://modultest.dk"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm">Modultest.dk</h3>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('modultest.description')}
            </p>
          </CardContent>
        </Card>
      </a>

      <p className="text-xs text-muted-foreground text-center mt-6">
        {t('modultest.tip')}
      </p>
    </PageContainer>
  )
}
