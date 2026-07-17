import type { LanguageCode, MessageDictionary } from './types'
import { DEFAULT_LANGUAGE } from './languages'
import { loadCalendarMessages } from './calendar'
import { loadLibraryGuideMessages } from './libraryGuide'
import { loadOneStopMessages } from './oneStop'

type LocaleModule = { default: MessageDictionary }

const LOCALE_LOADERS: Record<LanguageCode, () => Promise<LocaleModule>> = {
  en: () => import('./locales/en'),
  ko: () => import('./locales/ko'),
  zh: () => import('./locales/zh'),
  th: () => import('./locales/th'),
  bn: () => import('./locales/bn'),
  mn: () => import('./locales/mn'),
  vi: () => import('./locales/vi'),
  hi: () => import('./locales/hi'),
  kk: () => import('./locales/kk'),
  id: () => import('./locales/id'),
  fa: () => import('./locales/fa'),
  uz: () => import('./locales/uz'),
  ja: () => import('./locales/ja'),
  my: () => import('./locales/my'),
  ur: () => import('./locales/ur'),
  ru: () => import('./locales/ru'),
  am: () => import('./locales/am'),
  tr: () => import('./locales/tr'),
  es: () => import('./locales/es'),
}

let englishFallbackPromise: Promise<MessageDictionary> | null = null

/** Clear cached locale modules (needed after HMR updates to message files). */
export function clearLocaleCache() {
  englishFallbackPromise = null
}

async function loadEnglishFallback(): Promise<MessageDictionary> {
  if (!englishFallbackPromise) {
    englishFallbackPromise = LOCALE_LOADERS.en().then((module) => module.default)
  }
  return englishFallbackPromise
}

export async function loadLocale(language: LanguageCode): Promise<MessageDictionary> {
  // Always re-import so newly added keys are picked up after HMR / edits.
  clearLocaleCache()

  const loader = LOCALE_LOADERS[language] ?? LOCALE_LOADERS[DEFAULT_LANGUAGE]
  const [messages, fallback, oneStopMessages, libraryMessages, calendarMessages] =
    await Promise.all([
      loader().then((m) => m.default),
      loadEnglishFallback(),
      loadOneStopMessages(language),
      loadLibraryGuideMessages(language),
      loadCalendarMessages(language),
    ])
  const merged =
    language === DEFAULT_LANGUAGE ? messages : { ...fallback, ...messages }
  return { ...merged, ...oneStopMessages, ...libraryMessages, ...calendarMessages }
}

export async function preloadLocale(language: LanguageCode): Promise<void> {
  await loadLocale(language)
}

if (import.meta.hot) {
  import.meta.hot.accept(
    Object.keys(LOCALE_LOADERS).map((code) => `./locales/${code}`),
    () => {
      clearLocaleCache()
      window.dispatchEvent(new Event('hey_pnu_locale_changed'))
    },
  )
}
