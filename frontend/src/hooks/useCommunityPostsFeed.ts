import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'
import type { CommunityPost, CommunityScope } from '@/types/api'

/**
 * The community feed, served through the Express API.
 *
 * This used to query Postgres straight from the browser with the Supabase
 * anon key and subscribe to realtime changes. That only works if
 * VITE_SUPABASE_ANON_KEY is present in the build — and Vite inlines every
 * VITE_ variable into the JavaScript it ships, so shipping the feed meant
 * shipping a working database credential to anyone who opened devtools.
 * Only student_timetable and the course tables have row level security, so
 * that key could read and write `student`, `is_admin` included.
 *
 * Going through the API keeps the browser bundle credential-free. The cost is
 * realtime push: a post by someone else now appears on the next refresh rather
 * than the instant it is written. The refresh follows the same shape the notice
 * feed already uses — poll on an interval, but only while the tab is actually
 * visible, so a backgrounded phone is not making requests for nothing.
 *
 * The caller's own actions do not wait for a poll: CommunityPage applies them
 * immediately through upsertPost / patchPost / removePost.
 */
const FEED_REFRESH_INTERVAL_MS = 45_000

function upsertOne(existing: CommunityPost[], post: CommunityPost): CommunityPost[] {
  const index = existing.findIndex((item) => item.id === post.id)
  if (index >= 0) {
    const next = [...existing]
    next[index] = post
    return next
  }
  return [post, ...existing]
}

export function useCommunityPostsFeed({
  scope,
  groupId,
  enabled = true,
}: {
  scope: CommunityScope
  groupId: number | null
  enabled?: boolean
}) {
  const { t } = useLanguage()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Held in a ref so the polling effect does not restart every time the
  // language context hands back a new t(). That churn is why several screens
  // in this app fetch two or three times on a cold mount. Written in an
  // effect rather than during render, which React does not allow.
  const errorTextRef = useRef(t('community.feedLoadError'))
  useEffect(() => {
    errorTextRef.current = t('community.feedLoadError')
  }, [t])

  const upsertPost = useCallback((post: CommunityPost) => {
    setPosts((current) => upsertOne(current, post))
  }, [])

  const patchPost = useCallback((postId: string, patch: Partial<CommunityPost>) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, ...patch } : post)),
    )
  }, [])

  const removePost = useCallback((postId: string) => {
    setPosts((current) => current.filter((post) => post.id !== postId))
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(true)
      return
    }

    // A group-scoped feed has nothing to ask for until the group is known.
    if (scope !== 'all' && !groupId) {
      setPosts([])
      setLoading(false)
      setError('')
      return
    }

    let active = true

    async function refresh({ initial = false }: { initial?: boolean } = {}) {
      if (initial) {
        setLoading(true)
        setError('')
      }
      try {
        const rows = await api.getCommunityPosts({ scope, groupId })
        if (active) {
          setPosts(rows)
          setError('')
        }
      } catch (err) {
        // A failed background poll leaves the posts already on screen alone —
        // replacing a readable feed with an error because one refresh missed
        // would be worse than showing slightly stale posts.
        if (active && initial) {
          setError(err instanceof Error ? err.message : errorTextRef.current)
          setPosts([])
        }
      } finally {
        if (active && initial) setLoading(false)
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') void refresh()
    }

    void refresh({ initial: true })
    const timer = window.setInterval(refreshWhenVisible, FEED_REFRESH_INTERVAL_MS)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [enabled, scope, groupId])

  return {
    posts,
    loading,
    error,
    upsertPost,
    patchPost,
    removePost,
  }
}
