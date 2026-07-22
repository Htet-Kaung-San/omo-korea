import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  mapCommunityPostFromSupabase,
  type SupabaseCommunityPostRow,
} from '@/api/real/communityMappers'
import { useLanguage } from '@/context/LanguageContext'
import { supabase } from '@/lib/supabase'
import type { CommunityPost, CommunityScope } from '@/types/api'

const POST_SELECT = `
  *,
  student (
    student_id,
    name,
    nationality,
    major:major_id ( major_name )
  ),
  community_group ( slug )
`

function upsertOne(existing: CommunityPost[], post: CommunityPost): CommunityPost[] {
  const index = existing.findIndex((item) => item.id === post.id)
  if (index >= 0) {
    const next = [...existing]
    next[index] = post
    return next
  }
  return [post, ...existing]
}

async function fetchCommunityPosts(
  scope: CommunityScope,
  groupId: number | null,
): Promise<CommunityPost[]> {
  if (!supabase) return []

  let query = supabase
    .from('community_post')
    .select(POST_SELECT)
    .eq('reported', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (scope === 'all') {
    query = query.eq('scope', 'all')
  } else if (groupId) {
    query = query.eq('group_id', groupId)
  } else {
    return []
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as SupabaseCommunityPostRow[]).map(mapCommunityPostFromSupabase)
}

async function fetchCommunityPostById(postId: number): Promise<CommunityPost | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('community_post')
    .select(POST_SELECT)
    .eq('post_id', postId)
    .eq('reported', false)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapCommunityPostFromSupabase(data as SupabaseCommunityPostRow)
}

function patchFromRealtimeRow(
  existing: CommunityPost,
  row: SupabaseCommunityPostRow,
): CommunityPost {
  return {
    ...existing,
    content: row.content,
    hashtags: Array.isArray(row.hashtags) ? row.hashtags : existing.hashtags,
    likes: row.likes_count ?? existing.likes,
    comments: row.comments_count ?? existing.comments,
    createdAt: row.created_at,
    timeAgo: existing.timeAgo,
  }
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
  const channelRef = useRef<RealtimeChannel | null>(null)

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

    if (!supabase) {
      setPosts([])
      setLoading(false)
      setError('')
      return
    }

    if (scope !== 'all' && !groupId) {
      setPosts([])
      setLoading(false)
      setError('')
      return
    }

    let cancelled = false

    async function loadInitial() {
      setLoading(true)
      setError('')
      try {
        const rows = await fetchCommunityPosts(scope, groupId)
        if (!cancelled) setPosts(rows)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('community.feedLoadError'))
          setPosts([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadInitial()

    const filter =
      scope === 'all' && !groupId
        ? 'scope=eq.all'
        : groupId
          ? `group_id=eq.${groupId}`
          : null

    if (filter) {
      const channel = supabase
        .channel(`community-posts-${scope}-${groupId ?? 'all'}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'community_post',
            filter,
          },
          (payload) => {
            if (cancelled) return

            if (payload.eventType === 'DELETE') {
              const oldRow = payload.old as { post_id?: number }
              if (oldRow.post_id != null) {
                removePost(String(oldRow.post_id))
              }
              return
            }

            const row = payload.new as SupabaseCommunityPostRow
            if (row.reported) {
              removePost(String(row.post_id))
              return
            }

            if (payload.eventType === 'INSERT') {
              void fetchCommunityPostById(row.post_id)
                .then((post) => {
                  if (post && !cancelled) upsertPost(post)
                })
                .catch(() => {
                  if (!cancelled) {
                    upsertPost(mapCommunityPostFromSupabase(row))
                  }
                })
              return
            }

            if (payload.eventType === 'UPDATE') {
              setPosts((current) => {
                const existing = current.find((post) => post.id === String(row.post_id))
                if (existing) {
                  return upsertOne(current, patchFromRealtimeRow(existing, row))
                }
                return current
              })

              void fetchCommunityPostById(row.post_id)
                .then((post) => {
                  if (post && !cancelled) upsertPost(post)
                })
                .catch(() => undefined)
            }
          },
        )
        .subscribe()

      channelRef.current = channel
    }

    return () => {
      cancelled = true
      if (channelRef.current && supabase) {
        void supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, scope, groupId, upsertPost, removePost, t])

  return {
    posts,
    loading,
    error,
    upsertPost,
    patchPost,
    removePost,
  }
}
