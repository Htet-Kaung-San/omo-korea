import { normalizeLanguageCode, type LanguageCode } from '@/i18n/translations'

const LANGUAGE_STORAGE_KEY = 'hey_pnu_language'

export function getAcceptLanguage(): LanguageCode {
  return normalizeLanguageCode(localStorage.getItem(LANGUAGE_STORAGE_KEY))
}
