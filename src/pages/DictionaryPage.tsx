import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ExternalLink, AlertCircle, Plus, Check, ChevronDown, Search } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { AVAILABLE_MODULES, FEATURES } from '@/lib/constants'
import { addUserWord, isWordSaved, syncWordToSupabase } from '@/lib/user-words'
import { useAuth } from '@/hooks/useAuth'
import { useWords } from '@/hooks/useWords'

const DDO_URL = 'https://ordnet.dk/ddo/ordbog?query='

interface DictionaryEntry {
  headword: string
  partOfSpeech: string
  partOfSpeechNormalized: string
  pronunciation: string
  definitions: { text: string; examples: string[] }[]
  inflections: string[]
  gender: 'en' | 'et' | null
  structuredInflections: Record<string, string> | null
}

interface DictionaryError {
  error: string
  suggestions?: string[]
}

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; entry: DictionaryEntry }
  | { status: 'not_found'; suggestions: string[] }
  | { status: 'error'; message: string }

export function DictionaryPage() {
  const [searchParams] = useSearchParams()
  const [lookupState, setLookupState] = useState<LookupState>({ status: 'idle' })
  const [lastQuery, setLastQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('danskprep_dict_recent') ?? '[]')
    } catch {
      return []
    }
  })
  const [wordSaved, setWordSaved] = useState(false)
  const [inSeedData, setInSeedData] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState('pd3m2')
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false)
  const [mobileSearchTerm, setMobileSearchTerm] = useState('')
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  const { user } = useAuth()
  const { words: allWords, seedWords, refreshUserWords } = useWords()

  const handleSearch = useCallback(async (word: string) => {
    const term = word.trim()
    if (!term) return

    // Save to recent searches
    setRecentSearches(prev => {
      const updated = [term, ...prev.filter(w => w.toLowerCase() !== term.toLowerCase())].slice(0, 10)
      localStorage.setItem('danskprep_dict_recent', JSON.stringify(updated))
      return updated
    })

    setLastQuery(term)
    setLookupState({ status: 'loading' })
    const termLower = term.toLowerCase()
    setWordSaved(isWordSaved(term))
    setInSeedData(seedWords.some(w => w.danish.toLowerCase() === termLower))

    try {
      const res = await fetch(`/api/dictionary?q=${encodeURIComponent(term)}`)
      if (res.ok) {
        const entry: DictionaryEntry = await res.json()
        setLookupState({ status: 'success', entry })
        const headLower = entry.headword.toLowerCase()
        setWordSaved(isWordSaved(entry.headword))
        setInSeedData(seedWords.some(w => w.danish.toLowerCase() === headLower))
      } else if (res.status === 404) {
        const data: DictionaryError = await res.json()
        setLookupState({ status: 'not_found', suggestions: data.suggestions ?? [] })
      } else {
        setLookupState({ status: 'error', message: t('dictionary.networkError') })
      }
    } catch {
      setLookupState({ status: 'error', message: t('dictionary.networkError') })
    }
  }, [t, seedWords])

  // Auto-search when ?q= param is present (from header search).
  // Use a ref for handleSearch so the effect only re-runs when the query changes,
  // not when handleSearch is recreated (which would cancel the pending RAF).
  const handleSearchRef = useRef(handleSearch)
  useEffect(() => {
    handleSearchRef.current = handleSearch
  }, [handleSearch])
  const pendingQuery = searchParams.get('q')
  const pendingQueryRef = useRef<string | null>(null)
  useEffect(() => {
    if (pendingQuery && pendingQuery !== pendingQueryRef.current) {
      pendingQueryRef.current = pendingQuery
      handleSearchRef.current(pendingQuery)
    }
  }, [pendingQuery])

  function handleAddToVocab() {
    if (lookupState.status !== 'success') return
    const entry = lookupState.entry
    const mod = AVAILABLE_MODULES.find(m => m.id === selectedModule)
    const moduleLevel = mod?.id === 'pd2' ? 2 : mod?.id === 'pd3m1' ? 3 : 3

    // Check duplicates against all words (seed + user-added)
    const headLower = entry.headword.toLowerCase()
    if (allWords.some(w => w.danish.toLowerCase() === headLower)) {
      setWordSaved(true)
      setAddDialogOpen(false)
      return
    }

    // DDO is Danish-Danish — truncate the definition for the english field
    const rawDef = entry.definitions[0]?.text ?? ''
    const shortDef = rawDef.length > 80 ? rawDef.slice(0, 77) + '...' : rawDef

    // First example sentence as example_da
    const firstExample = entry.definitions.flatMap(d => d.examples)[0] ?? null

    try {
      const saved = addUserWord({
        danish: entry.headword,
        english: shortDef,
        part_of_speech: entry.partOfSpeechNormalized || 'unknown',
        gender: entry.gender,
        module_level: moduleLevel,
        difficulty: 1,
        inflections: entry.structuredInflections,
        example_da: firstExample,
        example_en: null,
        added_by: user?.email ?? 'anonymous',
        tags: ['user-added'],
      })
      // Refresh the hook state so Vocabulary page picks up the new word
      refreshUserWords()
      setWordSaved(true)
      setAddDialogOpen(false)
      // Best-effort Supabase sync
      syncWordToSupabase(saved)
    } catch {
      // Already saved — just close
      setWordSaved(true)
      setAddDialogOpen(false)
    }
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('dictionary.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('dictionary.subtitle')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('dictionary.poweredBy')}
        </p>
      </div>

      {/* Mobile search bar — visible only on small screens where header search is hidden */}
      <div className="sm:hidden mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400 pointer-events-none" />
          <input
            ref={mobileInputRef}
            type="text"
            value={mobileSearchTerm}
            onChange={e => setMobileSearchTerm(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && mobileSearchTerm.trim()) {
                handleSearch(mobileSearchTerm.trim())
                setMobileSearchTerm('')
              }
            }}
            placeholder={t('dictionary.placeholder')}
            aria-label={t('dictionary.placeholder')}
            className="h-11 w-full rounded-lg border-2 border-pink-200 dark:border-pink-800/60 bg-pink-50/50 dark:bg-pink-950/20 pl-9 pr-3 text-sm placeholder:text-pink-300 dark:placeholder:text-pink-700 shadow-[0_0_8px_rgba(236,72,153,0.15)] focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-700 focus:border-pink-400 dark:focus:border-pink-600 focus:bg-background focus:shadow-[0_0_12px_rgba(236,72,153,0.25)] transition-all"
          />
        </div>
      </div>

      {/* Idle state — show recent searches + hint */}
      {lookupState.status === 'idle' && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground hidden sm:block">
              {t('dictionary.useHeaderSearch')}
            </p>
            <p className="text-sm text-muted-foreground sm:hidden">
              {t('dictionary.placeholder')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {lookupState.status === 'loading' && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="animate-pulse space-y-3">
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="space-y-2 mt-4">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-4 w-5/6 bg-muted rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {lookupState.status === 'success' && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-4">
            {/* Headword + POS + Add to vocab */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{lookupState.entry.headword}</h2>
                {lookupState.entry.partOfSpeech && (
                  <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                    {lookupState.entry.partOfSpeech}
                  </span>
                )}
                {lookupState.entry.pronunciation && (
                  <span className="text-sm text-muted-foreground font-mono">
                    {lookupState.entry.pronunciation}
                  </span>
                )}
              </div>

              {/* Add to vocabulary button (feature-flagged) */}
              {FEATURES.DICT_ADD_TO_VOCAB && (
                inSeedData ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 shrink-0">
                    <Check className="h-3.5 w-3.5" />
                    {t('dictionary.inVocabulary')}
                  </span>
                ) : wordSaved ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 shrink-0">
                    <Check className="h-3.5 w-3.5" />
                    {t('dictionary.saved')}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setAddDialogOpen(true)}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('dictionary.addToVocab')}
                  </Button>
                )
              )}
            </div>

            {/* Inflections */}
            {lookupState.entry.inflections.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  {t('dictionary.inflections')}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {lookupState.entry.inflections.map((form, i) => (
                    <span
                      key={i}
                      className="rounded-md border px-2 py-0.5 text-sm font-mono"
                    >
                      {form}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Definitions */}
            {lookupState.entry.definitions.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {t('dictionary.definitions')}
                </h3>
                <ol className="space-y-3 list-decimal list-inside">
                  {lookupState.entry.definitions.map((def, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      <span>{def.text}</span>
                      {def.examples.length > 0 && (
                        <ul className="mt-1 ml-5 space-y-0.5">
                          {def.examples.map((ex, j) => (
                            <li key={j} className="text-xs text-muted-foreground italic">
                              {ex}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Link to ordnet.dk */}
            <a
              href={`${DDO_URL}${encodeURIComponent(lastQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              {t('dictionary.browseFull')}
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      )}

      {/* Not found */}
      {lookupState.status === 'not_found' && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm">{t('dictionary.notFound')}</p>
                {lookupState.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lookupState.suggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => handleSearch(s)}
                        className="rounded-full border px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <a
                  href={`${DDO_URL}${encodeURIComponent(lastQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary hover:underline"
                >
                  {t('dictionary.browseFull')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {lookupState.status === 'error' && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm">{lookupState.message}</p>
                <a
                  href={`${DDO_URL}${encodeURIComponent(lastQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary hover:underline"
                >
                  {t('dictionary.browseFull')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-medium mb-2">{t('dictionary.recent')}</h2>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map(word => (
              <button
                key={word}
                onClick={() => handleSearch(word)}
                className="rounded-full border px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Direct link */}
      <div className="mt-6 text-center">
        <a
          href="https://ordnet.dk/ddo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('dictionary.browseFull')}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Add to vocabulary dialog (feature-flagged) */}
      {FEATURES.DICT_ADD_TO_VOCAB && <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('dictionary.addToVocab')}</DialogTitle>
            <DialogDescription>{t('dictionary.addToVocabDesc')}</DialogDescription>
          </DialogHeader>
          {lookupState.status === 'success' && (
            <div className="space-y-4 py-2">
              {/* Word preview */}
              <div className="rounded-md border p-3 space-y-1.5">
                <p className="font-bold">{lookupState.entry.headword}</p>
                {lookupState.entry.definitions[0] && (
                  <p className="text-sm text-muted-foreground">{lookupState.entry.definitions[0].text}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-medium">
                    user-added
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {user?.email ?? 'anonymous'}
                  </span>
                </div>
              </div>

              {/* Module selector */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('dictionary.selectModule')}</label>
                <div className="relative">
                  <button
                    onClick={() => setModuleDropdownOpen(o => !o)}
                    className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <span>{AVAILABLE_MODULES.find(m => m.id === selectedModule)?.label ?? selectedModule}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {moduleDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-50" onClick={() => setModuleDropdownOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border bg-background shadow-lg py-1">
                        {AVAILABLE_MODULES.map(mod => (
                          <button
                            key={mod.id}
                            onClick={() => { setSelectedModule(mod.id); setModuleDropdownOpen(false) }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                              selectedModule === mod.id ? 'font-medium text-primary' : ''
                            }`}
                          >
                            {mod.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Confirm button */}
              <Button onClick={handleAddToVocab} className="w-full">
                <Plus className="h-4 w-4 mr-1.5" />
                {t('dictionary.confirmAdd')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>}
    </PageContainer>
  )
}
