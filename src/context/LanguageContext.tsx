import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  LANGUAGE_OPTIONS,
  TRANSLATIONS,
  type LanguageCode,
  type LanguageOption,
} from '@/i18n/translations'

const LANGUAGE_STORAGE_KEY = 'hey_pnu_language'

interface LanguageContextValue {
  language: LanguageCode
  locale: string
  options: LanguageOption[]
  setLanguage: (language: LanguageCode) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
    template,
  )
}

function getInitialLanguage(): LanguageCode {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'EN' || stored === 'KO' || stored === 'ZH') {
    return stored
  }
  return 'EN'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage)

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage)
  }, [])

  const locale =
    LANGUAGE_OPTIONS.find((option) => option.code === language)?.locale ?? 'en-US'

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dictionary = TRANSLATIONS[language]
      const fallbackDictionary = TRANSLATIONS.EN
      const template = dictionary[key] ?? fallbackDictionary[key] ?? key
      return interpolate(template, vars)
    },
    [language],
  )

  const value = useMemo(
    () => ({
      language,
      locale,
      options: LANGUAGE_OPTIONS,
      setLanguage,
      t,
    }),
    [language, locale, setLanguage, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
