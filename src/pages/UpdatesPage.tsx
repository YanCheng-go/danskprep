import { useTranslation } from '@/lib/i18n'
import { PageContainer } from '@/components/layout/PageContainer'
import { WhatsNew, FullChangelog } from '@/components/progress/WhatsNew'

export function UpdatesPage() {
  const { t } = useTranslation()

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('updates.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('updates.subtitle')}
        </p>
      </div>

      {/* Latest as highlighted card */}
      <div className="mb-8">
        <WhatsNew alwaysShow />
      </div>

      {/* Full changelog */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t('updates.previousUpdates')}</h2>
        <FullChangelog />
      </div>
    </PageContainer>
  )
}
