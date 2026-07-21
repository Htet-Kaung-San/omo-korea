import type { Notification, ScholarshipItem } from '@/types/api'

const SCHOLARSHIP_ID_PREFIX = 'scholarship-'

export function scholarshipToNotification(item: ScholarshipItem): Notification {
  const date =
    item.deadlineAt ??
    (() => {
      const parsed = new Date(item.deadline)
      return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10)
    })()

  return {
    id: `${SCHOLARSHIP_ID_PREFIX}${item.id}`,
    title: item.title,
    body: item.description,
    date,
    category: 'DEADLINE',
    priority: 'HIGH',
    source: item.provider ?? 'PNU Scholarship Office',
    channel: 'scholarship',
    read: false,
  }
}

export function mergeNoticeFeed(
  notifications: Notification[],
  scholarships: ScholarshipItem[],
): Notification[] {
  const merged = [...notifications, ...scholarships.map(scholarshipToNotification)]
  const byId = new Map<string, Notification>()
  for (const notice of merged) {
    byId.set(notice.id, notice)
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

export function isScholarshipNotice(notice: Pick<Notification, 'id' | 'channel'>): boolean {
  return notice.channel === 'scholarship' || notice.id.startsWith(SCHOLARSHIP_ID_PREFIX)
}

export function scholarshipNoticePath(notice: Pick<Notification, 'id'>): string {
  return `/academic/scholarships/${notice.id.replace(/^scholarship-/, '')}`
}
