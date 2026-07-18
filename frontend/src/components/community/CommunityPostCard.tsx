import { CalendarDays, MessageCircle, MoreHorizontal, Share2, ThumbsUp } from 'lucide-react'
import type { CommunityPost } from '@/types/api'

interface CommunityPostCardProps {
  post: CommunityPost
  onLike?: (postId: string) => void
}

export function CommunityPostCard({ post, onLike }: CommunityPostCardProps) {
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
                {post.timeAgo} · {post.authorNationality}
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg p-1 text-pnu-muted hover:bg-black/5"
              aria-label="More"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
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
          aria-label="Share"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}
