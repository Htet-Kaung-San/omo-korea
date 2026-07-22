import { useEffect, useRef, useState } from 'react'
import { CalendarDays, MessageCircle, MoreHorizontal, Share2, ThumbsUp, Trash2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import type { CommunityPost } from '@/types/api'

interface CommunityPostCardProps {
  post: CommunityPost
  onLike?: (postId: string) => void
  canDelete?: boolean
  onDelete?: (postId: string) => void
}

export function CommunityPostCard({ post, onLike, canDelete, onDelete }: CommunityPostCardProps) {
  const { t, locale } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function handleDelete() {
    setMenuOpen(false)
    if (!window.confirm(t('community.deleteConfirm'))) return
    onDelete?.(post.id)
  }

  return (
    <article className="rounded-[18px] bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pnu-blue/10 text-[13px] font-bold text-pnu-blue">
          {post.authorInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[14px] font-bold text-pnu-text">{post.authorName}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${post.majorTone}`}
                >
                  {post.authorMajor}
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-pnu-muted">
                {formatRelativeTime(post.createdAt, t, locale)} · {post.authorNationality}
              </p>
            </div>
            {canDelete ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="rounded-lg p-1 text-pnu-muted hover:bg-black/5"
                  aria-label={t('community.postOptions')}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[140px] overflow-hidden rounded-[12px] bg-white py-1 shadow-lg ring-1 ring-black/8"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleDelete()}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('community.deletePost')}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-relaxed text-pnu-text">{post.content}</p>
          {post.hashtags.length > 0 ? (
            <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[13px] font-semibold text-pnu-blue">
              {post.hashtags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </p>
          ) : null}
        </div>
        {post.eventDate ? (
          <div className="flex h-[72px] w-[64px] shrink-0 flex-col items-center justify-center rounded-2xl bg-pnu-blue text-white shadow-sm">
            <CalendarDays className="mb-0.5 h-3.5 w-3.5 opacity-80" />
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-90">
              {post.eventDate.month}
            </span>
            <span className="text-[18px] font-bold leading-none">{post.eventDate.day}</span>
            <span className="text-[10px] opacity-90">{post.eventDate.weekday}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-pnu-border/70 pt-3 text-[13px] text-pnu-muted">
        <button
          type="button"
          onClick={() => onLike?.(post.id)}
          className="inline-flex items-center gap-1.5 font-medium hover:text-pnu-blue"
        >
          <ThumbsUp className="h-4 w-4" />
          {post.likes}
        </button>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <MessageCircle className="h-4 w-4" />
          {post.comments}
        </span>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1.5 font-medium hover:text-pnu-blue"
          aria-label={t('community.action.share')}
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}
