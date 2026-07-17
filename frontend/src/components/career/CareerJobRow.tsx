import { Bookmark } from 'lucide-react'
import type { CareerOpportunity } from '@/types/api'
import { useLanguage } from '@/context/LanguageContext'
import {
  companyInitials,
  companyLogoTone,
  formatDeadlineBadge,
  inferCareerJobType,
  jobTypeLabelKey,
} from '@/utils/career'

export type CareerJobRowVariant = 'recommended' | 'latest'

interface CareerJobRowProps {
  opportunity: CareerOpportunity
  variant: CareerJobRowVariant
  bookmarked?: boolean
  onToggleBookmark?: (id: string) => void
}

export function CareerJobRow({
  opportunity,
  variant,
  bookmarked = false,
  onToggleBookmark,
}: CareerJobRowProps) {
  const { t } = useLanguage()
  const jobType = inferCareerJobType(opportunity)
  const location = opportunity.location?.trim() || 'Korea'
  const meta = `${location} · ${t(jobTypeLabelKey(jobType))}`
  const tone = companyLogoTone(opportunity.company)

  return (
    <a
      href={opportunity.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#F8F8FB] active:bg-[#F2F2F7]"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[13px] font-bold ${tone}`}
      >
        {opportunity.logoUrl ? (
          <img
            src={opportunity.logoUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          companyInitials(opportunity.company)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold leading-snug text-pnu-text">
          {opportunity.title}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-pnu-muted">{opportunity.company}</p>
        <p className="mt-0.5 truncate text-[12px] text-pnu-muted/80">{meta}</p>
        {opportunity.matchReason ? (
          <p className="mt-1 truncate text-[11px] font-medium text-pnu-blue">
            {opportunity.matchReason}
          </p>
        ) : null}
      </div>

      {variant === 'recommended' ? (
        <button
          type="button"
          aria-label={t('career.bookmark')}
          aria-pressed={bookmarked}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onToggleBookmark?.(opportunity.id)
          }}
          className={`rounded-lg p-2 transition ${
            bookmarked
              ? 'text-pnu-blue'
              : 'text-pnu-muted hover:bg-black/5 hover:text-pnu-text'
          }`}
        >
          <Bookmark
            className="h-5 w-5"
            strokeWidth={1.9}
            fill={bookmarked ? 'currentColor' : 'none'}
          />
        </button>
      ) : (
        <span className="shrink-0 text-[14px] font-bold text-[#F97316]">
          {formatDeadlineBadge(opportunity.deadline)}
        </span>
      )}
    </a>
  )
}
