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
  clearLocaleCache,
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

/** Set by the provider so non-React callers can translate. See translateStatic. */
let currentTranslate:
  | ((key: string, vars?: Record<string, string | number>) => string)
  | null = null

/**
 * Translate from outside the React tree — specifically the API client, which
 * raises toasts and cannot call a hook.
 *
 * `fallback` is returned when the provider has not mounted yet or the key is
 * missing. t() returns the key itself when it cannot resolve one, and showing a
 * user the raw string "errors.network" would be worse than English.
 */
export function translateStatic(key: string, fallback: string): string {
  if (!currentTranslate) return fallback
  const resolved = currentTranslate(key)
  return resolved === key ? fallback : resolved
}

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

    const onLocaleChanged = () => {
      clearLocaleCache()
      void loadLocale(language).then((loaded) => {
        if (cancelled) return
        setMessages(loaded)
        if (language !== DEFAULT_LANGUAGE) {
          void loadLocale(DEFAULT_LANGUAGE).then((english) => {
            if (!cancelled) setFallbackMessages(english)
          })
        } else {
          setFallbackMessages(loaded)
        }
      })
    }
    window.addEventListener('hey_pnu_locale_changed', onLocaleChanged)

    return () => {
      cancelled = true
      window.removeEventListener('hey_pnu_locale_changed', onLocaleChanged)
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

  // Publish the active translator for code that runs outside the React tree.
  // The API client raises toasts and has no way to reach a hook.
  useEffect(() => {
    currentTranslate = t
    return () => {
      if (currentTranslate === t) currentTranslate = null
    }
  }, [t])

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
