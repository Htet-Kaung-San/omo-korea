import type { LanguageCode, MessageDictionary } from '../types'

const LOCALE_LOADERS: Record<LanguageCode, () => Promise<{ default: MessageDictionary }>> = {
  en: () => import('./messages/en'),
  ko: () => import('./messages/ko'),
  zh: () => import('./messages/zh'),
  th: () => import('./messages/th'),
  bn: () => import('./messages/bn'),
  mn: () => import('./messages/mn'),
  vi: () => import('./messages/vi'),
  hi: () => import('./messages/hi'),
  kk: () => import('./messages/kk'),
  id: () => import('./messages/id'),
  fa: () => import('./messages/fa'),
  uz: () => import('./messages/uz'),
  ja: () => import('./messages/ja'),
  my: () => import('./messages/my'),
  ur: () => import('./messages/ur'),
  ru: () => import('./messages/ru'),
  am: () => import('./messages/am'),
  tr: () => import('./messages/tr'),
  es: () => import('./messages/es'),
}

let englishLibraryPromise: Promise<MessageDictionary> | null = null

async function loadEnglishLibrary(): Promise<MessageDictionary> {
  if (!englishLibraryPromise) {
    englishLibraryPromise = LOCALE_LOADERS.en().then((module) => module.default)
  }
  return englishLibraryPromise
}

export async function loadLibraryGuideMessages(language: LanguageCode): Promise<MessageDictionary> {
  const loader = LOCALE_LOADERS[language] ?? LOCALE_LOADERS.en
  const [messages, fallback] = await Promise.all([
    loader().then((module) => module.default),
    loadEnglishLibrary(),
  ])

  return language === 'en' ? messages : { ...fallback, ...messages }
}
