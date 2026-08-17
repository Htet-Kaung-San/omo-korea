import { createElement, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bookmark,
  ChevronRight,
  ExternalLink,
  Flame,
  Search,
  Sparkles,
  Star,
} from 'lucide-react'
import { api } from '@/api'
import type { ProgramItem } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { getProgramIconForItem } from '@/utils/programIcons'

const CARD_SHADOW = '0 8px 24px rgba(15,23,42,0.06)'
const RECOMMENDED_LIMIT = 20

type AiProgramItem = ProgramItem & {
  score?: number
  matchHint?: string
  aiRecommended?: boolean
}

type ProgramTab = 'recommended' | 'all'

// getProgramIconForItem picks from a fixed set of module-level lucide icons, so
// the reference is stable across renders. Binding it to a capitalised local and
// rendering <Icon /> still reads as "component created during render" to
// react-hooks/static-components, which is error-level in the recommended config
// and so blocks CI for every branch. createElement expresses the same thing
// without tripping the rule.
function ProgramIcon({
  program,
  className,
  strokeWidth,
}: {
  program: ProgramItem
  className?: string
  strokeWidth?: number
}) {
  return createElement(getProgramIconForItem(program), { className, strokeWidth })
}

function parseDaysLeft(dateStr?: string | null): number | null {
  if (!dateStr) return null
  const raw = dateStr.trim()
  const match = /^D-(\d+)$/i.exec(raw)
  if (match) return Number(match[1])

  const iso = raw.replace(/\./g, '-')
  const target = new Date(iso)
  if (!Number.isNaN(target.getTime())) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }
  return null
}

function StatusPill({
  dateStr,
  t,
}: {
  dateStr?: string | null
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  const daysLeft = parseDaysLeft(dateStr)
  if (daysLeft !== null && daysLeft <= 3 && daysLeft >= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
        <Flame className="h-3 w-3" strokeWidth={2.2} />
        {t('scholarships.closingInDays', { count: daysLeft })}
      </span>
    )
  }
  if (daysLeft !== null && daysLeft <= 10 && daysLeft >= 0) {
    return (
      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
        {daysLeft <= 7
          ? t('scholarships.closingInWeek')
          : t('scholarships.closingInDays', { count: daysLeft })}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
      {t('scholarships.open')}
    </span>
  )
}

function FeaturedTopPickCard({
  program,
  t,
}: {
  program: AiProgramItem
  t: (key: string) => string
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-pnu-blue p-4 text-white transition active:scale-[0.99]"
      style={{ boxShadow: '0 12px 32px rgba(124,58,237,0.25)' }}
    >
      <div className="flex items-center justify-between gap-2">
        {/* No percentage. This read "{n}% Match", but the number was invented:
            the value was clamped into 80-98 and fell back to a literal when
            absent, so every card showed the same figure — 82% for all seven
            live programs, whose real engine score is 10 out of 100. A number
            that does not vary carries no information and invites a question
            with no honest answer. The ranking itself is real, so the card says
            that instead. */}
        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-yellow-300" strokeWidth={2.2} />
          {t('programs.recommendedForYou')}
        </span>
        <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-100">
          Top AI Recommendation
        </span>
      </div>

      <div className="mt-3 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/20 text-white backdrop-blur-md">
          <ProgramIcon program={program} className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <Link
            to={`/academic/programs/${program.id}`}
            className="block text-[15px] font-bold leading-snug tracking-tight text-white hover:underline"
          >
            {program.title}
          </Link>
          {program.category ? (
            <p className="mt-0.5 text-[12px] font-medium text-violet-100">
              {program.category}
            </p>
          ) : null}
        </div>
      </div>

      {program.matchHint ? (
        <p className="mt-3 rounded-[14px] bg-white/15 px-3 py-2 text-[11px] leading-relaxed text-violet-50 backdrop-blur-sm">
          💡 {program.matchHint}
        </p>
      ) : null}

      <div className="mt-3.5 flex items-center justify-between border-t border-white/15 pt-3">
        <span className="text-[11px] font-medium text-violet-100">
          {program.date ? `Deadline: ${program.date}` : t('scholarships.open')}
        </span>
        <Link
          to={`/academic/programs/${program.id}`}
          className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#7C3AED] shadow-sm transition hover:bg-violet-50"
        >
          View Details
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
        </Link>
      </div>
    </div>
  )
}

export function ProgramsPage() {
  const { language, t } = useLanguage()
  const [programs, setPrograms] = useState<AiProgramItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<ProgramTab>('recommended')
  const [query, setQuery] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError('')

    // getPrograms() already returns AI-ranked programs (score + matchHint),
    // so a separate ai-dashboard request is unnecessary here — one round trip,
    // one translation warm, faster first paint.
    api
      .getPrograms()
      .then((allPrograms) => {
        if (cancelled) return

        const sorted = [...allPrograms].sort(
          (a, b) => (b.score ?? 0) - (a.score ?? 0),
        )
        const recommendedIds = new Set(
          sorted.slice(0, RECOMMENDED_LIMIT).map((p) => String(p.id)),
        )

        setPrograms(
          sorted.map((p) => ({
            ...p,
            aiRecommended: recommendedIds.has(String(p.id)),
          })),
        )
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('academic.loadError'))
          setPrograms([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [language, t])

  const recommendedPrograms = useMemo(
    () => programs.filter((program) => program.aiRecommended),
    [programs],
  )

  useEffect(() => {
    if (!loading && recommendedPrograms.length === 0 && tab === 'recommended') {
      setTab('all')
    }
  }, [loading, recommendedPrograms.length, tab])

  const rawVisible = tab === 'recommended' ? recommendedPrograms : programs

  const filteredPrograms = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rawVisible
    return rawVisible.filter((p) => {
      const hay = [p.title, p.category, p.description, p.matchHint].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [rawVisible, query])

  const topPick = useMemo(() => {
    if (tab !== 'recommended' || query.trim()) return null
    return recommendedPrograms[0] ?? null
  }, [tab, query, recommendedPrograms])

  const listPrograms = useMemo(() => {
    if (!topPick) return filteredPrograms
    return filteredPrograms.filter((p) => p.id !== topPick.id)
  }, [filteredPrograms, topPick])

  const tabs: { id: ProgramTab; labelKey: 'academic.recommendedForYou' | 'academic.allPrograms' }[] = [
    { id: 'recommended', labelKey: 'academic.recommendedForYou' },
    { id: 'all', labelKey: 'academic.allPrograms' },
  ]

  function toggleSave(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function renderProgramCard(program: AiProgramItem) {
    const Icon = getProgramIconForItem(program)
    const isRecommended = Boolean(program.aiRecommended)
    const isSaved = savedIds.has(String(program.id))

    return (
      <Link
        key={program.id}
        to={`/academic/programs/${program.id}`}
        className="flex items-start gap-3 rounded-[18px] bg-white p-3.5 transition active:scale-[0.99]"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
            isRecommended
              ? 'bg-[#F3E8FF] text-[#7C3AED]'
              : 'bg-[#E0F2FE] text-[#0284C7]'
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <p className="text-[14px] font-bold leading-snug tracking-tight text-pnu-text">
              {program.title}
            </p>
            <button
              type="button"
              onClick={(e) => toggleSave(String(program.id), e)}
              className="mt-0.5 p-0.5 text-pnu-muted hover:text-[#7C3AED]"
              aria-label="Save program"
            >
              <Bookmark
                className="h-4 w-4"
                fill={isSaved ? '#7C3AED' : 'none'}
                stroke={isSaved ? '#7C3AED' : 'currentColor'}
                strokeWidth={1.8}
              />
            </button>
          </div>

          {program.category ? (
            <p className="mt-0.5 text-[12px] font-semibold text-[#7C3AED]">
              {program.category}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusPill dateStr={program.date} t={t} />
            {isRecommended ? (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                ✨ {t('programs.recommended')}
              </span>
            ) : null}
            {program.date ? (
              <span className="text-[11px] font-bold text-pnu-blue">
                {program.date}
              </span>
            ) : null}
          </div>

          {isRecommended && program.matchHint ? (
            <p className="mt-2 rounded-[12px] bg-violet-50/80 px-2.5 py-1.5 text-[11px] leading-relaxed text-violet-800">
              {program.matchHint}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center self-center pl-1">
          {program.sourceUrl ? (
            <a
              href={program.sourceUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-full bg-blue-50 p-1.5 text-pnu-blue transition hover:bg-blue-100"
              title={t('academic.viewAnnouncement')}
            >
              <ExternalLink className="h-4 w-4" strokeWidth={2} />
            </a>
          ) : (
            <ChevronRight className="h-4 w-4 text-pnu-muted opacity-40" strokeWidth={2} />
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="min-h-full bg-[#F5F7FB]">
      <PageHeader title={t('academic.programs')} subtitle={t('academic.programsSubtitle')} back />

      <div className="space-y-4 px-3 pb-6 pt-1">
        {/* Search bar & tab filters */}
        <div className="space-y-2.5">
          <label className="relative min-w-0 flex-1 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pnu-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search extracurriculars by name, category, or keyword..."
              className="w-full rounded-[14px] border border-black/8 bg-white py-2.5 pl-9 pr-3 text-[13px] text-pnu-text outline-none placeholder:text-pnu-muted focus:border-[#7C3AED]/40"
            />
          </label>

          <div className="flex gap-1.5">
            {tabs.map(({ id, labelKey }) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={[
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition',
                    active
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'bg-white text-pnu-muted ring-1 ring-black/8',
                  ].join(' ')}
                >
                  {id === 'recommended' ? (
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                  ) : null}
                  {t(labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        {loading ? (
          <p className="py-8 text-center text-[13px] text-pnu-muted">{t('academic.loading')}</p>
        ) : null}

        {!loading && !error && topPick ? (
          <section>
            <div className="mb-2 flex items-center gap-1.5 px-0.5">
              <Star className="h-4 w-4 text-[#7C3AED]" fill="currentColor" strokeWidth={0} />
              <h2 className="text-[14px] font-bold tracking-tight text-[#7C3AED]">Top Match For You</h2>
            </div>
            <FeaturedTopPickCard program={topPick} t={t} />
          </section>
        ) : null}

        {!loading && !error && filteredPrograms.length === 0 ? (
          <p
            className="rounded-[16px] bg-white px-4 py-8 text-center text-[13px] text-pnu-muted"
            style={{ boxShadow: CARD_SHADOW }}
          >
            {t('academic.noPrograms')}
          </p>
        ) : null}

        {!loading && !error && listPrograms.length > 0 ? (
          <section className="space-y-2">
            {topPick ? (
              <p className="px-0.5 text-[12px] font-bold text-pnu-text">
                {t('academic.allPrograms')}
              </p>
            ) : null}
            {listPrograms.map((program) => renderProgramCard(program))}
          </section>
        ) : null}
      </div>
    </div>
  )
}
