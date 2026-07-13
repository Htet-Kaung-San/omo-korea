export type LanguageCode =
  | 'en'
  | 'ko'
  | 'zh'
  | 'th'
  | 'bn'
  | 'mn'
  | 'vi'
  | 'hi'
  | 'kk'
  | 'id'
  | 'fa'
  | 'uz'
  | 'ja'
  | 'my'
  | 'ur'
  | 'ru'
  | 'am'
  | 'tr'
  | 'es'

export type MessageDictionary = Record<string, string>

export interface LanguageOption {
  code: LanguageCode
  nativeLabel: string
  locale: string
}
