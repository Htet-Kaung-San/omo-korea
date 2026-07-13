import type { LanguageCode, LanguageOption } from './types'

export type { LanguageCode, LanguageOption, MessageDictionary } from './types'

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', nativeLabel: 'English', locale: 'en-US' },
  { code: 'ko', nativeLabel: '한국어', locale: 'ko-KR' },
  { code: 'zh', nativeLabel: '中文', locale: 'zh-CN' },
  { code: 'th', nativeLabel: 'ไทย', locale: 'th-TH' },
  { code: 'bn', nativeLabel: 'বাংলা', locale: 'bn-BD' },
  { code: 'mn', nativeLabel: 'Монгол', locale: 'mn-MN' },
  { code: 'vi', nativeLabel: 'Tiếng Việt', locale: 'vi-VN' },
  { code: 'hi', nativeLabel: 'हिन्दी', locale: 'hi-IN' },
  { code: 'kk', nativeLabel: 'Қазақ', locale: 'kk-KZ' },
  { code: 'id', nativeLabel: 'Bahasa Indonesia', locale: 'id-ID' },
  { code: 'fa', nativeLabel: 'فارسی', locale: 'fa-IR' },
  { code: 'uz', nativeLabel: 'Oʻzbek', locale: 'uz-UZ' },
  { code: 'ja', nativeLabel: '日本語', locale: 'ja-JP' },
  { code: 'my', nativeLabel: 'မြန်မာ', locale: 'my-MM' },
  { code: 'ur', nativeLabel: 'اردو', locale: 'ur-PK' },
  { code: 'ru', nativeLabel: 'Русский', locale: 'ru-RU' },
  { code: 'am', nativeLabel: 'አማርኛ', locale: 'am-ET' },
  { code: 'tr', nativeLabel: 'Türkçe', locale: 'tr-TR' },
  { code: 'es', nativeLabel: 'Español', locale: 'es-ES' },
]

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

const LEGACY_LANGUAGE_MAP: Record<string, LanguageCode> = {
  EN: 'en',
  KO: 'ko',
  ZH: 'zh',
}

export function normalizeLanguageCode(value: string | null | undefined): LanguageCode {
  if (!value) return DEFAULT_LANGUAGE
  const lower = value.toLowerCase()
  if (LANGUAGE_OPTIONS.some((option) => option.code === lower)) {
    return lower as LanguageCode
  }
  return LEGACY_LANGUAGE_MAP[value] ?? DEFAULT_LANGUAGE
}
