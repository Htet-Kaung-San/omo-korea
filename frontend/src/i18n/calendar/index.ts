import type { LanguageCode, MessageDictionary } from '../types'
import { getCalendarMessages } from './titles'

export async function loadCalendarMessages(language: LanguageCode): Promise<MessageDictionary> {
  return getCalendarMessages(language)
}
