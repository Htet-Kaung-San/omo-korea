import type { LanguageCode, MessageDictionary } from '../types'
import { COMMUNITY_PAGE_MESSAGES } from './messages'
import { buildCommunityMajorMessages } from './tabLabels'

export async function loadCommunityMessages(language: LanguageCode): Promise<MessageDictionary> {
  const fallback = COMMUNITY_PAGE_MESSAGES.en
  const localized = COMMUNITY_PAGE_MESSAGES[language] ?? fallback
  const pageMessages = language === 'en' ? localized : { ...fallback, ...localized }
  const majorMessages = buildCommunityMajorMessages(language)

  return { ...pageMessages, ...majorMessages }
}
