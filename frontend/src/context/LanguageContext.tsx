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
  DEFAULT_LANGUAGE,
  LANGUAGE_OPTIONS,
  loadLocale,
  normalizeLanguageCode,
  type LanguageCode,
  type LanguageOption,
  type MessageDictionary,
} from '@/i18n/translations'

const LANGUAGE_STORAGE_KEY = 'hey_pnu_language'

interface LanguageContextValue {
  language: LanguageCode
  locale: string
  options: LanguageOption[]
  localeLoading: boolean
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
  return normalizeLanguageCode(localStorage.getItem(LANGUAGE_STORAGE_KEY))
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage)
  const [messages, setMessages] = useState<MessageDictionary>({})
  const [fallbackMessages, setFallbackMessages] = useState<MessageDictionary>({})
  const [localeLoading, setLocaleLoading] = useState(true)

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  useEffect(() => {
    let cancelled = false
    setLocaleLoading(true)

    loadLocale(language)
      .then((loaded) => {
        if (cancelled) return
        setMessages(loaded)
        if (language !== DEFAULT_LANGUAGE) {
          return loadLocale(DEFAULT_LANGUAGE).then((english) => {
            if (!cancelled) setFallbackMessages(english)
          })
        }
        setFallbackMessages(loaded)
      })
      .finally(() => {
        if (!cancelled) setLocaleLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [language])

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage)
  }, [])

  const locale =
    LANGUAGE_OPTIONS.find((option) => option.code === language)?.locale ?? 'en-US'

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const template = messages[key] ?? fallbackMessages[key] ?? key
      return interpolate(template, vars)
    },
    [fallbackMessages, messages],
  )

  const value = useMemo(
    () => ({
      language,
      locale,
      options: LANGUAGE_OPTIONS,
      localeLoading,
      setLanguage,
      t,
    }),
    [language, locale, localeLoading, setLanguage, t],
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
