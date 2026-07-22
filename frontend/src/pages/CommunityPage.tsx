import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Filter, Plus, Search, X } from 'lucide-react'
import { api } from '@/api'
import { CommunityPostCard } from '@/components/community/CommunityPostCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCommunityPostsFeed } from '@/hooks/useCommunityPostsFeed'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { translateCountryLabel, translateMajorLabel } from '@/i18n/community/tabLabels'
import type { CommunityGroup, CommunityScope } from '@/types/api'

const TAB_ORDER: CommunityScope[] = ['department', 'country', 'all']

type CommunitySort = 'latest' | 'popularity'

const SORT_OPTIONS: Array<{ id: CommunitySort; labelKey: string }> = [
  { id: 'latest', labelKey: 'community.sortLatest' },
  { id: 'popularity', labelKey: 'community.sortPopular' },
]

export function CommunityPage() {
  const { t, locale } = useLanguage()
  const { user } = useAuth()

  const [scope, setScope] = useState<CommunityScope>('department')
  const [sort, setSort] = useState<CommunitySort>('latest')
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [group, setGroup] = useState<CommunityGroup | null>(null)
  const [groupLoading, setGroupLoading] = useState(true)
  const [groupError, setGroupError] = useState('')
  const [posting, setPosting] = useState(false)

  const feedGroupId = scope === 'all' ? null : (group?.groupId ?? null)
  const feedEnabled = scope === 'all' || !groupLoading

  const {
    posts,
    loading: postsLoading,
    error: postsError,
    upsertPost,
    patchPost,
    removePost,
  } = useCommunityPostsFeed({
    scope,
    groupId: feedGroupId,
    enabled: feedEnabled,
  })

  const loading = groupLoading || postsLoading
  const error = groupError || postsError

  useEffect(() => {
    let cancelled = false

    async function loadGroup() {
      setGroupLoading(true)
      setGroupError('')
      setGroup(null)
      try {
        if (scope === 'all') {
          if (!cancelled) setGroup(null)
          return
        }
        const myGroup = await api.getMyCommunityGroup(scope)
        if (!cancelled) setGroup(myGroup)
      } catch (err) {
        if (!cancelled) {
          setGroupError(err instanceof Error ? err.message : t('community.loadError'))
          setGroup(null)
        }
      } finally {
        if (!cancelled) setGroupLoading(false)
      }
    }

    void loadGroup()
    return () => {
      cancelled = true
    }
  }, [scope, t])

  useEffect(() => {
    if (!sortOpen) return
    function handleClick(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [sortOpen])

  const visiblePosts = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? posts.filter(
          (post) =>
            post.content.toLowerCase().includes(q) ||
            post.authorName.toLowerCase().includes(q) ||
            post.hashtags.some((tag) => tag.toLowerCase().includes(q)),
        )
      : posts

    const sorted = [...filtered]
    if (sort === 'popularity') {
      sorted.sort((a, b) => {
        const scoreA = a.likes + a.comments
        const scoreB = b.likes + b.comments
        if (scoreB !== scoreA) return scoreB - scoreA
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    } else {
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    }
    return sorted
  }, [posts, query, sort])

  const activeSort = SORT_OPTIONS.find((option) => option.id === sort) ?? SORT_OPTIONS[0]

  const tabLabels = useMemo(
    () => ({
      department:
        translateMajorLabel(group?.name || user?.major, t) || t('community.tab.department'),
      country:
        translateCountryLabel(user?.nationality, locale) || t('community.tab.country'),
      all: t('community.tab.all'),
    }),
    [group?.name, user?.major, user?.nationality, t, locale],
  )

  async function handleLike(postId: string) {
    try {
      const result = await api.likeCommunityPost(postId)
      patchPost(result.id, { likes: result.likes })
    } catch {
      // ignore like failures for now
    }
  }

  async function handleDelete(postId: string) {
    try {
      await api.deleteCommunityPost(postId)
      removePost(postId)
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : t('community.deleteError'))
    }
  }

  const canCreatePost = scope === 'all' || Boolean(group)

  async function handleCreatePost() {
    const content = draft.trim()
    if (content.length < 3 || posting || !canCreatePost) return

    setPosting(true)
    try {
      const created = await api.createCommunityPost({
        content,
        scope,
        groupId: group?.groupId ?? null,
        groupSlug: group?.slug ?? (scope === 'all' ? 'all-intl' : null),
      })
      upsertPost(created)
      setDraft('')
      setComposerOpen(false)
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : t('community.postError'))
    } finally {
      setPosting(false)
    }
  }

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
              <button type="button" onClick={() => setQuery('')} aria-label={t('common.clear')}>
                <X className="h-4 w-4 text-pnu-muted" />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TAB_ORDER.map((tabId) => {
            const active = scope === tabId
            return (
              <button
                key={tabId}
                type="button"
                onClick={() => setScope(tabId)}
                className={`max-w-[min(100%,14rem)] shrink-0 truncate rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                  active
                    ? 'bg-pnu-blue text-white shadow-sm shadow-blue-200'
                    : 'bg-[#F2F2F7] text-pnu-text'
                }`}
              >
                {tabLabels[tabId]}
              </button>
            )
          })}
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        <div className="flex items-center justify-end">
          <div ref={sortRef} className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((open) => !open)}
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition',
                sortOpen || sort !== 'latest'
                  ? 'bg-pnu-blue/10 text-pnu-blue ring-1 ring-pnu-blue/20'
                  : 'bg-white text-pnu-muted ring-1 ring-black/8',
              ].join(' ')}
            >
              <Filter className="h-3.5 w-3.5" strokeWidth={2} />
              {t(activeSort.labelKey)}
              <ChevronDown
                className={['h-3.5 w-3.5 transition-transform', sortOpen ? 'rotate-180' : ''].join(
                  ' ',
                )}
                strokeWidth={2}
              />
            </button>

            {sortOpen ? (
              <div
                role="listbox"
                className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[160px] overflow-hidden rounded-[12px] bg-white py-1 shadow-lg ring-1 ring-black/8"
              >
                {SORT_OPTIONS.map((option) => {
                  const active = sort === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setSort(option.id)
                        setSortOpen(false)
                      }}
                      className={[
                        'flex w-full px-3 py-2 text-left text-[12px] font-semibold transition',
                        active ? 'bg-pnu-blue/10 text-pnu-blue' : 'text-pnu-text hover:bg-[#F8F8FB]',
                      ].join(' ')}
                    >
                      {t(option.labelKey)}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>

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
              <CommunityPostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                canDelete={Boolean(user?.studentId && post.authorStudentId === user.studentId)}
                onDelete={handleDelete}
              />
            ))
          )}
        </section>
      </div>

      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        disabled={!canCreatePost}
        aria-label={t('community.createPost')}
        className="fixed bottom-24 right-[max(1rem,calc(50%-11.5rem))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-pnu-blue text-white shadow-lg shadow-blue-300/50 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
                aria-label={t('community.close')}
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
                disabled={draft.trim().length < 3 || posting || !canCreatePost}
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
