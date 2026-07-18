import type { CommunityGroup, CommunityMember, CommunityPost } from '@/types/api'

const MAJOR_TONES = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
]

const AVATAR_TONES = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
]

function hashTone(value: string, tones: string[]): string {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash + value.charCodeAt(i) * (i + 1)) % tones.length
  }
  return tones[hash] ?? tones[0]
}

export function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

export function majorToneFromName(major: string): string {
  return hashTone(major || 'major', MAJOR_TONES)
}

export function avatarToneFromName(name: string): string {
  return hashTone(name || 'user', AVATAR_TONES)
}

export function formatTimeAgo(iso: string): string {
  const created = new Date(iso).getTime()
  if (Number.isNaN(created)) return ''
  const diffMs = Date.now() - created
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function mapCommunityGroup(row: {
  id?: string
  group_id: number
  slug: string
  scope: CommunityGroup['scope']
  name: string
  icon: string
  member_count?: number
  new_post_count?: number
  joined?: boolean
  banner_title: string
  banner_body: string
}): CommunityGroup {
  return {
    id: row.slug || String(row.group_id),
    groupId: row.group_id,
    slug: row.slug,
    scope: row.scope,
    name: row.name,
    icon: row.icon,
    memberCount: row.member_count ?? 0,
    newPostCount: row.new_post_count ?? 0,
    joined: row.joined ?? true,
    bannerTitle: row.banner_title,
    bannerBody: row.banner_body,
  }
}

export function mapCommunityMember(row: {
  id: string
  name: string
  nationality: string
  major: string
}): CommunityMember {
  return {
    id: row.id,
    name: row.name,
    nationality: row.nationality,
    major: row.major,
    avatarTone: avatarToneFromName(row.name),
  }
}

export function mapCommunityPost(row: {
  id: string
  group_id: number | null
  group_slug: string | null
  scope: CommunityPost['scope']
  content: string
  hashtags?: string[]
  likes: number
  comments: number
  created_at: string
  author_name: string
  author_nationality: string
  author_major: string
  event_date?: CommunityPost['eventDate']
}): CommunityPost {
  return {
    id: row.id,
    groupId: row.group_id,
    groupSlug: row.group_slug,
    scope: row.scope,
    content: row.content,
    hashtags: row.hashtags ?? [],
    likes: row.likes ?? 0,
    comments: row.comments ?? 0,
    createdAt: row.created_at,
    authorName: row.author_name,
    authorInitials: initialsFromName(row.author_name),
    authorMajor: row.author_major,
    majorTone: majorToneFromName(row.author_major),
    authorNationality: row.author_nationality,
    timeAgo: formatTimeAgo(row.created_at),
    eventDate: row.event_date ?? null,
  }
}
