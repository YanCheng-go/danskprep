import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import en from '@/data/translations/en'
import da from '@/data/translations/da'
import { SETTINGS_KEYS } from './constants'

export type Locale = 'en' | 'da'

interface I18nContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

const translations: Record<Locale, Record<string, string>> = { en, da }

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEYS.LOCALE)
      if (stored === 'da' || stored === 'en') return stored
    } catch {
      // ignore
    }
    return 'da'
  })

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(SETTINGS_KEYS.LOCALE, l)
    } catch {
      // ignore
    }
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[locale][key] ?? translations.en[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useTranslation must be used within I18nProvider')
  }
  return ctx
}
