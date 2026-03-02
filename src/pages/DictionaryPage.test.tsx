import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/lib/i18n'
import { DictionaryPage } from './DictionaryPage'

// Mock useAuth — no user signed in
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, signOut: vi.fn() }),
}))

// Mock useWords — provide stable seed words
vi.mock('@/hooks/useWords', () => ({
  useWords: () => ({
    words: [],
    seedWords: [],
    filteredWords: [],
    searchTerm: '',
    setSearchTerm: vi.fn(),
    posFilter: '',
    setPosFilter: vi.fn(),
    getWord: () => undefined,
    refreshUserWords: vi.fn(),
  }),
}))

// Mock user-words module
vi.mock('@/lib/user-words', () => ({
  addUserWord: vi.fn(),
  isWordSaved: () => false,
  syncWordToSupabase: vi.fn(),
  loadUserWords: () => [],
  loadUserWordsFromSupabase: () => Promise.resolve([]),
}))

const MOCK_ENTRY = {
  headword: 'test',
  partOfSpeech: 'substantiv, fælleskøn',
  partOfSpeechNormalized: 'noun',
  pronunciation: '[ˈtɛsd]',
  definitions: [{ text: 'en prøve eller undersøgelse', examples: ['tage en test'] }],
  inflections: ['testen', 'tester', 'testerne'],
  gender: 'en' as const,
  structuredInflections: null,
}

function renderWithRouter(initialEntry: string) {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <DictionaryPage />
      </MemoryRouter>
    </I18nProvider>
  )
}

describe('DictionaryPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    // Clear localStorage between tests
    localStorage.removeItem('danskprep_dict_recent')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows idle state when no query param', () => {
    renderWithRouter('/dictionary')
    // The idle card should be visible (desktop message)
    expect(screen.getByText(/look up a word/i)).toBeInTheDocument()
  })

  it('triggers lookup when ?q= param is present and shows results', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_ENTRY),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRouter('/dictionary?q=test')

    // Should transition to loading, then success
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/dictionary?q=test')
      )
    })

    // Should display the headword from the result (in h2)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'test', level: 2 })).toBeInTheDocument()
    })

    // Should display the definition
    expect(screen.getByText('en prøve eller undersøgelse')).toBeInTheDocument()

    // Should display inflections
    expect(screen.getByText('testen')).toBeInTheDocument()
  })

  it('shows not_found state with suggestions when word is unknown', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'not_found', suggestions: ['teste', 'tekst'] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRouter('/dictionary?q=xyznotaword')

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    // Should show the not found message
    await waitFor(() => {
      expect(screen.getByText(/not found|ikke fundet/i)).toBeInTheDocument()
    })

    // Should show suggestions
    expect(screen.getByText('teste')).toBeInTheDocument()
    expect(screen.getByText('tekst')).toBeInTheDocument()
  })

  it('shows error state on network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.stubGlobal('fetch', fetchMock)

    renderWithRouter('/dictionary?q=test')

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    // Should show the error message
    await waitFor(() => {
      expect(screen.getByText(/could not connect|kunne ikke forbinde/i)).toBeInTheDocument()
    })
  })

  it('saves search term to recent searches', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_ENTRY),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRouter('/dictionary?q=bil')

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    // Check localStorage was updated with the search term
    const recent = JSON.parse(localStorage.getItem('danskprep_dict_recent') ?? '[]')
    expect(recent).toContain('bil')
  })
})
