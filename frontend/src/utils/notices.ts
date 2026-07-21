import type { Notification } from '@/types/api'
import { isScholarshipNotice, scholarshipNoticePath } from '@/utils/noticeFeed'

/** Prefer original board URL when present; otherwise in-app detail. */
export function noticeHref(notice: Pick<Notification, 'id' | 'sourceUrl' | 'channel'>): string {
  if (notice.sourceUrl) return notice.sourceUrl
  if (isScholarshipNotice(notice)) return scholarshipNoticePath(notice)
  return `/notifications/${notice.id}`
}

export function isExternalNotice(notice: Pick<Notification, 'sourceUrl'>): boolean {
  return Boolean(notice.sourceUrl)
}
