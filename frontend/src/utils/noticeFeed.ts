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
    kind: 'SCHOLARSHIP',
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
  const rankedNotices = notifications.filter(
    (item) => (item.kind ?? 'NOTICE') === 'NOTICE',
  )
  const checklistItems = notifications.filter(
    (item) => item.kind === 'CHECKLIST',
  )
  const scholarshipItems = scholarships
    .map(scholarshipToNotification)
    .sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })

  // Personalized notice ranking is authoritative. Checklist reminders retain
  // backend due-date order, and scholarship cards form the final group.
  const merged = [...rankedNotices, ...checklistItems, ...scholarshipItems]
  const byId = new Map<string, Notification>()
  for (const notice of merged) {
    byId.set(notice.id, notice)
  }
  return [...byId.values()]
}

export function isScholarshipNotice(notice: Pick<Notification, 'id' | 'channel'>): boolean {
  return notice.channel === 'scholarship' || notice.id.startsWith(SCHOLARSHIP_ID_PREFIX)
}

export function scholarshipNoticePath(notice: Pick<Notification, 'id'>): string {
  return `/academic/scholarships/${notice.id.replace(/^scholarship-/, '')}`
}
