import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { api } from '@/api'
import { CommunityPostCard } from '@/components/community/CommunityPostCard'
import { CommunityScopeBanner } from '@/components/community/CommunityScopeBanner'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import type { CommunityGroup, CommunityPost, CommunityScope } from '@/types/api'

const TABS: Array<{ id: CommunityScope; labelKey: string }> = [
  { id: 'department', labelKey: 'community.tab.department' },
  { id: 'country', labelKey: 'community.tab.country' },
  { id: 'all', labelKey: 'community.tab.all' },
]

export function CommunityPage() {
  const { t } = useLanguage()
  const { user } = useAuth()

  const [scope, setScope] = useState<CommunityScope>('department')
  const [query, setQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [group, setGroup] = useState<CommunityGroup | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        if (scope === 'all') {
          const nextPosts = await api.getCommunityPosts({ scope: 'all' })
          if (cancelled) return
          setGroup(null)
          setPosts(nextPosts)
        } else {
          const myGroup = await api.getMyCommunityGroup(scope)
          if (cancelled) return
          setGroup(myGroup)
          if (!myGroup) {
            setPosts([])
          } else {
            const groupPosts = await api.getCommunityPosts({
              scope,
              groupSlug: myGroup.slug,
              groupId: myGroup.groupId,
            })
            if (!cancelled) setPosts(groupPosts)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('community.loadError'))
          setGroup(null)
          setPosts([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [scope, t])

  const visiblePosts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return posts
    return posts.filter(
      (post) =>
        post.content.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q) ||
        post.hashtags.some((tag) => tag.toLowerCase().includes(q)),
    )
  }, [posts, query])

  async function handleLike(postId: string) {
    try {
      const result = await api.likeCommunityPost(postId)
      setPosts((current) =>
        current.map((post) =>
          post.id === result.id ? { ...post, likes: result.likes } : post,
        ),
      )
    } catch {
      // ignore like failures for now
    }
  }

  async function handleCreatePost() {
    const content = draft.trim()
    if (content.length < 3 || posting) return

    setPosting(true)
    try {
      const created = await api.createCommunityPost({
        content,
        scope,
        groupId: group?.groupId ?? null,
        groupSlug: group?.slug ?? (scope === 'all' ? 'all-intl' : null),
      })
      setPosts((current) => [created, ...current])
      setDraft('')
      setComposerOpen(false)
      if (group) {
        setGroup({ ...group, newPostCount: group.newPostCount + 1 })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('community.postError'))
    } finally {
      setPosting(false)
    }
  }

  const initials = (user?.name ?? 'Y')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  const groups = group ? [group] : []

  return (
    <div className="relative pb-24">
      <PageHeader
        title={t('community.title')}
        subtitle={t('community.subtitle')}
        back
        action={
          <button
            type="button"
            aria-label={t('community.search')}
            onClick={() => setShowSearch((open) => !open)}
            className="rounded-xl bg-white p-2 text-pnu-muted shadow-sm ring-1 ring-pnu-border transition hover:text-pnu-blue"
          >
            <Search className="h-4 w-4" />
          </button>
        }
      />

      <div className="space-y-4 px-4 pt-3">
        {showSearch ? (
          <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-black/5">
            <Search className="h-4 w-4 text-pnu-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('community.searchPlaceholder')}
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-pnu-muted"
              autoFocus
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear">
                <X className="h-4 w-4 text-pnu-muted" />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const active = scope === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScope(tab.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                  active
                    ? 'bg-pnu-blue text-white shadow-sm shadow-blue-200'
                    : 'bg-[#F2F2F7] text-pnu-text'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            )
          })}
        </div>

        <CommunityScopeBanner scope={scope} groups={groups} />

        {error ? (
          <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        <section className="rounded-[18px] bg-white p-3.5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pnu-blue/10 text-[12px] font-bold text-pnu-blue">
              {initials || 'Y'}
            </div>
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="min-w-0 flex-1 rounded-full bg-[#F2F2F7] px-4 py-2.5 text-left text-[13px] text-pnu-muted"
            >
              {t('community.whatsOnMind')}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1 border-t border-pnu-border/70 pt-3">
            {[
              { icon: Pencil, labelKey: 'community.action.post', tone: 'text-pnu-blue' },
              { icon: ImageIcon, labelKey: 'community.action.photo', tone: 'text-emerald-600' },
              { icon: BarChart3, labelKey: 'community.action.poll', tone: 'text-violet-600' },
              { icon: CalendarDays, labelKey: 'community.action.event', tone: 'text-orange-500' },
            ].map(({ icon: Icon, labelKey, tone }) => (
              <button
                key={labelKey}
                type="button"
                onClick={() => setComposerOpen(true)}
                className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold text-pnu-muted transition hover:bg-[#F8F8FB]"
              >
                <Icon className={`h-4 w-4 ${tone}`} strokeWidth={1.9} />
                {t(labelKey)}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          {loading ? (
            <p className="rounded-[18px] bg-white px-4 py-8 text-center text-sm text-pnu-muted shadow-sm ring-1 ring-black/5">
              {t('community.loading')}
            </p>
          ) : visiblePosts.length === 0 ? (
            <p className="rounded-[18px] bg-white px-4 py-8 text-center text-sm text-pnu-muted shadow-sm ring-1 ring-black/5">
              {t('community.noPosts')}
            </p>
          ) : (
            visiblePosts.map((post) => (
              <CommunityPostCard key={post.id} post={post} onLike={handleLike} />
            ))
          )}
        </section>
      </div>

      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        aria-label={t('community.createPost')}
        className="fixed bottom-24 right-[max(1rem,calc(50%-11.5rem))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-pnu-blue text-white shadow-lg shadow-blue-300/50 transition active:scale-95"
      >
        <Plus className="h-6 w-6" strokeWidth={2.2} />
      </button>

      {composerOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[22px] bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-pnu-text">{t('community.createPost')}</h3>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="rounded-lg p-1 text-pnu-muted hover:bg-black/5"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              placeholder={t('community.whatsOnMind')}
              className="w-full resize-none rounded-2xl bg-[#F2F2F7] px-3.5 py-3 text-[14px] text-pnu-text outline-none ring-1 ring-transparent focus:ring-pnu-blue/30"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="rounded-full px-4 py-2 text-[13px] font-semibold text-pnu-muted"
              >
                {t('community.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleCreatePost()}
                disabled={draft.trim().length < 3 || posting}
                className="rounded-full bg-pnu-blue px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                {t('community.action.post')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
