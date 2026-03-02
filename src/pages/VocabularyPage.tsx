import { useWords } from '@/hooks/useWords'
import { useTranslation } from '@/lib/i18n'
import { PageContainer } from '@/components/layout/PageContainer'
import { WordList } from '@/components/vocabulary/WordList'

export function VocabularyPage() {
  const { filteredWords, searchTerm, setSearchTerm, posFilter, setPosFilter } = useWords()
  const { t } = useTranslation()

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('vocab.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('vocab.subtitle')}</p>
      </div>
      <WordList
        words={filteredWords}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        posFilter={posFilter}
        onPosChange={setPosFilter}
      />
    </PageContainer>
  )
}
