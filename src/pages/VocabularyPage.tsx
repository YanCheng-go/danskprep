import { useWords } from '@/hooks/useWords'
import { PageContainer } from '@/components/layout/PageContainer'
import { WordList } from '@/components/vocabulary/WordList'

export function VocabularyPage() {
  const { filteredWords, searchTerm, setSearchTerm, posFilter, setPosFilter } = useWords()

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vocabulary</h1>
        <p className="text-muted-foreground text-sm mt-1">Module 2 word list</p>
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
