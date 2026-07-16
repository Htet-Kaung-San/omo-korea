import type { LanguageCode, MessageDictionary } from './types'
import { DEFAULT_LANGUAGE } from './languages'
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

async function loadEnglishFallback(): Promise<MessageDictionary> {
  if (!englishFallbackPromise) {
    englishFallbackPromise = LOCALE_LOADERS.en().then((module) => module.default)
  }
  return englishFallbackPromise
}

export async function loadLocale(language: LanguageCode): Promise<MessageDictionary> {
  const loader = LOCALE_LOADERS[language] ?? LOCALE_LOADERS[DEFAULT_LANGUAGE]
  const [messages, fallback, oneStopMessages, libraryMessages] = await Promise.all([
    loader().then((m) => m.default),
    loadEnglishFallback(),
    loadOneStopMessages(language),
    loadLibraryGuideMessages(language),
  ])
  const merged =
    language === DEFAULT_LANGUAGE ? messages : { ...fallback, ...messages }
  return { ...merged, ...oneStopMessages, ...libraryMessages }
}

export async function preloadLocale(language: LanguageCode): Promise<void> {
  await loadLocale(language)
}
