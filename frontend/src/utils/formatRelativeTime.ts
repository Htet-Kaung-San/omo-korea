export function formatRelativeTime(
  iso: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
  locale?: string,
): string {
  const created = new Date(iso).getTime()
  if (Number.isNaN(created)) return ''

  const diffMs = Date.now() - created
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return t('community.timeJustNow')
  if (minutes < 60) return t('home.timeAgoMinutes', { count: Math.max(1, minutes) })

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('home.timeAgoHours', { count: hours })

  const days = Math.floor(hours / 24)
  if (days < 7) return t('home.timeAgoDays', { count: days })

  return new Date(iso).toLocaleDateString(locale)
}
