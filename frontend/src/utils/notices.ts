import type { Notification } from '@/types/api'

/** Prefer original board URL when present; otherwise in-app detail. */
export function noticeHref(notice: Pick<Notification, 'id' | 'sourceUrl'>): string {
  if (notice.sourceUrl) return notice.sourceUrl
  return `/notifications/${notice.id}`
}

export function isExternalNotice(notice: Pick<Notification, 'sourceUrl'>): boolean {
  return Boolean(notice.sourceUrl)
}
