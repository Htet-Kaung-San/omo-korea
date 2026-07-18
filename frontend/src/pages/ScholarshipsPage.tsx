import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Building2,
  ChevronRight,
  Filter,
  FlaskConical,
  Globe2,
  GraduationCap,
  HandHeart,
  Laptop,
  Plane,
  Search,
  Sparkles,
  Star,
  Flame,
  type LucideIcon,
} from 'lucide-react'
import { api } from '@/api'
import { mockScholarships } from '@/api/mock/data'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import type { ScholarshipCategory, ScholarshipItem } from '@/types/api'

const CARD_SHADOW = '0 8px 24px rgba(15,23,42,0.06)'

type Urgency = 'critical' | 'soon' | 'open'

type DisplayScholarship = ScholarshipItem & {
  category: ScholarshipCategory
  daysLeft: number | null
  urgency: Urgency
  Icon: LucideIcon
  iconTone: string
}

type FilterId = 'all' | 'closing' | 'department' | 'international'

function parseDaysLeft(item: ScholarshipItem): number | null {
  if (item.deadlineAt) {
    const target = new Date(item.deadlineAt)
    if (!Number.isNaN(target.getTime())) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      target.setHours(0, 0, 0, 0)
      return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }
  }
  const match = /^D-(\d+)$/i.exec(item.deadline.trim())
  if (match) return Number(match[1])
  return null
}

function inferCategory(item: ScholarshipItem): ScholarshipCategory {
  if (item.category) return item.category
  const hay = `${item.title} ${item.provider ?? ''} ${item.description}`.toLowerCase()
  if (/gks|government|niied|korea scholarship/.test(hay)) return 'government'
  if (/department|학과|major|research|academic excellence|computer science/.test(hay)) {
    return 'department'
  }
  if (/international|exchange|emergency|office|외국인|국제/.test(hay)) return 'international'
  return 'other'
}

function pickIcon(item: ScholarshipItem, category: ScholarshipCategory): {
  Icon: LucideIcon
  iconTone: string
} {
  const hay = `${item.title} ${item.description}`.toLowerCase()
  if (/research|assistant|flask|lab/.test(hay)) {
    return { Icon: FlaskConical, iconTone: 'bg-[#E0F2FE] text-[#0284C7]' }
  }
  if (/exchange|plane|flight/.test(hay)) {
    return { Icon: Plane, iconTone: 'bg-[#DCFCE7] text-[#16A34A]' }
  }
  if (/emergency|aid|hardship|heart/.test(hay)) {
    return { Icon: HandHeart, iconTone: 'bg-[#DCFCE7] text-[#059669]' }
  }
  if (/gks|global|government/.test(hay) || category === 'government') {
    return { Icon: Globe2, iconTone: 'bg-[#FEE2E2] text-[#E11D48]' }
  }
  if (/computer|cs |software|laptop/.test(hay) || category === 'department') {
    return { Icon: Laptop, iconTone: 'bg-[#E0F2FE] text-[#0284C7]' }
  }
  if (category === 'international') {
    return { Icon: GraduationCap, iconTone: 'bg-[#F3E8FF] text-[#7C3AED]' }
  }
  return { Icon: GraduationCap, iconTone: 'bg-[#F3E8FF] text-[#7C3AED]' }
}

function urgencyFromDays(days: number | null): Urgency {
  if (days == null || days < 0) return 'open'
  if (days <= 3) return 'critical'
  if (days <= 10) return 'soon'
  return 'open'
}

function formatDeadlineDate(
  item: ScholarshipItem,
  locale: string,
): string {
  const iso = item.deadlineAt
  if (iso) {
    const d = new Date(iso)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }
  return item.deadline
}

function toDisplay(item: ScholarshipItem): DisplayScholarship {
  const category = inferCategory(item)
  const daysLeft = parseDaysLeft(item)
  const { Icon, iconTone } = pickIcon(item, category)
  return {
    ...item,
    category,
    daysLeft,
    urgency: urgencyFromDays(daysLeft),
    Icon,
    iconTone,
  }
}

function StatusPill({
  urgency,
  daysLeft,
  t,
}: {
  urgency: Urgency
  daysLeft: number | null
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  if (urgency === 'critical' && daysLeft != null) {
    return (
      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
        {t('scholarships.closingInDays', { count: daysLeft })}
      </span>
    )
  }
  if (urgency === 'soon' && daysLeft != null) {
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

function FeaturedCard({
  item,
  locale,
  t,
  majorTag,
}: {
  item: DisplayScholarship
  locale: string
  t: (key: string, vars?: Record<string, string | number>) => string
  majorTag?: string
}) {
  const Icon = item.Icon
  return (
    <Link
      to={`/academic/scholarships/${item.id}`}
      className="flex items-start gap-3 rounded-[18px] bg-white p-3.5 transition active:scale-[0.99]"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${item.iconTone}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold leading-snug tracking-tight text-pnu-text">
          {item.title}
        </p>
        <p className="mt-0.5 text-[12px] font-semibold text-[#7C3AED]">
          {item.provider || t('scholarships.providerFallback')}
        </p>
        {(item.tag || majorTag) && (
          <span className="mt-1.5 inline-flex rounded-full bg-[#F3E8FF] px-2 py-0.5 text-[10px] font-semibold text-[#7C3AED]">
            {item.tag || majorTag}
          </span>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <StatusPill urgency="open" daysLeft={item.daysLeft} t={t} />
        <div className="text-right">
          <p className="text-[10px] font-medium text-pnu-muted">
            {t('scholarships.deadline')}
          </p>
          <p className="text-[12px] font-bold text-pnu-blue">
            {formatDeadlineDate(item, locale)}
          </p>
        </div>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-pnu-muted opacity-40" strokeWidth={2} />
    </Link>
  )
}

function ListCard({
  item,
  locale,
  t,
  deadlineTone,
}: {
  item: DisplayScholarship
  locale: string
  t: (key: string, vars?: Record<string, string | number>) => string
  deadlineTone: string
}) {
  const Icon = item.Icon
  return (
    <Link
      to={`/academic/scholarships/${item.id}`}
      className="flex items-center gap-3 rounded-[16px] bg-white px-3 py-3 transition active:scale-[0.99]"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${item.iconTone}`}
      >
        <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold tracking-tight text-pnu-text">
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-pnu-muted">
          {item.provider || t('scholarships.providerFallback')}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusPill urgency={item.urgency} daysLeft={item.daysLeft} t={t} />
          <span className={`text-[11px] font-bold ${deadlineTone}`}>
            {formatDeadlineDate(item, locale)}
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-pnu-muted opacity-40" strokeWidth={2} />
    </Link>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  tone,
  showViewAll,
  onViewAll,
  t,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  tone: string
  showViewAll?: boolean
  onViewAll?: () => void
  t: (key: string) => string
}) {
  return (
    <div className="mb-2 flex items-end justify-between gap-2 px-0.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Icon className={`h-4 w-4 ${tone}`} strokeWidth={2.2} />
          <h2 className={`text-[14px] font-bold tracking-tight ${tone}`}>{title}</h2>
        </div>
        {subtitle ? (
          <p className="mt-0.5 text-[11px] font-medium text-pnu-muted">{subtitle}</p>
        ) : null}
      </div>
      {showViewAll ? (
        <button
          type="button"
          onClick={onViewAll}
          className="shrink-0 text-[11px] font-semibold text-[#7C3AED]"
        >
          {t('common.viewAll')}
        </button>
      ) : null}
    </div>
  )
}

export function ScholarshipsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { language, locale, t } = useLanguage()
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterId>('all')
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    api
      .getScholarships()
      .then((items) => {
        if (items.length >= 5) {
          setScholarships(items)
          return
        }
        const titles = new Set(items.map((item) => item.title.toLowerCase()))
        const extras = mockScholarships.filter(
          (item) => !titles.has(item.title.toLowerCase()),
        )
        setScholarships([...items, ...extras])
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('academic.loadError')))
      .finally(() => setLoading(false))
  }, [language, t])

  const catalog = useMemo(() => scholarships.map(toDisplay), [scholarships])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalog.filter((item) => {
      if (filter === 'closing' && item.urgency === 'open') return false
      if (filter === 'department' && item.category !== 'department') return false
      if (filter === 'international' && item.category !== 'international' && item.category !== 'government') {
        return false
      }
      if (!q) return true
      return (
        item.title.toLowerCase().includes(q) ||
        (item.provider ?? '').toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      )
    })
  }, [catalog, filter, query])

  const recommended = useMemo(() => {
    const intl = filtered.find((s) => s.category === 'international')
    return intl ?? filtered[0] ?? null
  }, [filtered])

  const closingSoon = useMemo(
    () =>
      filtered
        .filter(
          (s) =>
            s.urgency !== 'open' &&
            s.daysLeft != null &&
            s.daysLeft >= 0 &&
            s.id !== recommended?.id,
        )
        .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999))
        .slice(0, 2),
    [filtered, recommended],
  )

  const department = useMemo(
    () =>
      filtered
        .filter((s) => s.category === 'department' && s.id !== recommended?.id)
        .slice(0, 2),
    [filtered, recommended],
  )

  const international = useMemo(
    () =>
      filtered
        .filter(
          (s) =>
            (s.category === 'international' || s.category === 'government') &&
            s.id !== recommended?.id &&
            !closingSoon.some((c) => c.id === s.id),
        )
        .slice(0, 2),
    [filtered, recommended, closingSoon],
  )

  const majorTag = user?.major
    ? t('scholarships.forMajor', { major: user.major })
    : undefined

  const filters: { id: FilterId; labelKey: string }[] = [
    { id: 'all', labelKey: 'scholarships.filterAll' },
    { id: 'closing', labelKey: 'scholarships.filterClosing' },
    { id: 'department', labelKey: 'scholarships.filterDepartment' },
    { id: 'international', labelKey: 'scholarships.filterInternational' },
  ]

  return (
    <div className="min-h-full bg-[#F5F7FB]">
      <header className="sticky top-0 z-10 bg-[#F5F7FB]/95 px-3 pb-2 pt-2 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-1">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-0.5 rounded-lg p-1 text-pnu-text transition hover:bg-black/5"
              aria-label={t('common.goBack')}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <div className="min-w-0 pt-0.5">
              <h1 className="text-[22px] font-bold leading-none tracking-tight text-pnu-text">
                {t('academic.scholarships')}
              </h1>
              <p className="mt-1 text-[12px] font-medium text-pnu-muted">
                {t('scholarships.subtitle')}
              </p>
            </div>
          </div>
          <Link
            to="/notifications"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#F3E8FF] text-[#7C3AED] transition active:scale-95"
            aria-label={t('notifications.title')}
          >
            <Bell className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pnu-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('scholarships.searchPlaceholder')}
              className="w-full rounded-[14px] border border-black/8 bg-white py-2.5 pl-9 pr-3 text-[13px] text-pnu-text outline-none placeholder:text-pnu-muted focus:border-[#7C3AED]/40"
            />
          </label>
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            className={[
              'inline-flex shrink-0 items-center gap-1.5 rounded-[14px] border px-3 py-2.5 text-[12px] font-semibold transition',
              filterOpen || filter !== 'all'
                ? 'border-[#7C3AED]/30 bg-[#F3E8FF] text-[#7C3AED]'
                : 'border-black/8 bg-white text-pnu-text',
            ].join(' ')}
          >
            <Filter className="h-3.5 w-3.5" strokeWidth={2} />
            {t('scholarships.filter')}
          </button>
        </div>

        {filterOpen ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {filters.map(({ id, labelKey }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setFilter(id)
                  setFilterOpen(false)
                }}
                className={[
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold transition',
                  filter === id
                    ? 'bg-[#7C3AED] text-white'
                    : 'bg-white text-pnu-muted ring-1 ring-black/8',
                ].join(' ')}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <div className="space-y-4 px-3 pb-6 pt-1">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? (
          <p className="py-8 text-center text-[13px] text-pnu-muted">{t('academic.loading')}</p>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <p className="rounded-[16px] bg-white px-4 py-8 text-center text-[13px] text-pnu-muted"
            style={{ boxShadow: CARD_SHADOW }}
          >
            {t('scholarships.empty')}
          </p>
        ) : null}

        {!loading && recommended ? (
          <section>
            <SectionHeader
              icon={Sparkles}
              title={t('scholarships.recommended')}
              subtitle={t('scholarships.recommendedSubtitle')}
              tone="text-[#7C3AED]"
              t={t}
            />
            <FeaturedCard item={recommended} locale={locale} t={t} majorTag={majorTag} />
          </section>
        ) : null}

        {!loading && closingSoon.length > 0 ? (
          <section>
            <SectionHeader
              icon={Flame}
              title={t('scholarships.closingSoon')}
              tone="text-[#E11D48]"
              showViewAll
              onViewAll={() => {
                setFilter('closing')
                setFilterOpen(false)
              }}
              t={t}
            />
            <div className="space-y-2">
              {closingSoon.map((item) => (
                <ListCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  t={t}
                  deadlineTone={
                    item.urgency === 'critical' ? 'text-red-600' : 'text-orange-600'
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        {!loading && department.length > 0 ? (
          <section>
            <SectionHeader
              icon={Building2}
              title={t('scholarships.department')}
              tone="text-[#0284C7]"
              showViewAll
              onViewAll={() => {
                setFilter('department')
                setFilterOpen(false)
              }}
              t={t}
            />
            <div className="space-y-2">
              {department.map((item) => (
                <ListCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  t={t}
                  deadlineTone="text-pnu-blue"
                />
              ))}
            </div>
          </section>
        ) : null}

        {!loading && international.length > 0 ? (
          <section>
            <SectionHeader
              icon={Globe2}
              title={t('scholarships.internationalOffice')}
              tone="text-[#16A34A]"
              showViewAll
              onViewAll={() => {
                setFilter('international')
                setFilterOpen(false)
              }}
              t={t}
            />
            <div className="space-y-2">
              {international.map((item) => (
                <ListCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  t={t}
                  deadlineTone="text-pnu-blue"
                />
              ))}
            </div>
          </section>
        ) : null}

        {!loading ? (
          <section
            className="flex items-center gap-3 rounded-[16px] bg-[#FFF8E7] px-3.5 py-3"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-white">
              <Star className="h-4 w-4" fill="currentColor" strokeWidth={0} />
            </span>
            <p className="min-w-0 flex-1 text-[11px] font-medium leading-snug text-[#92400E]">
              {t('scholarships.alertsBody')}
            </p>
            <Link
              to="/notifications"
              className="shrink-0 rounded-[10px] bg-[#F59E0B] px-2.5 py-2 text-[11px] font-bold text-white transition active:scale-95"
            >
              {t('scholarships.turnOnAlerts')}
            </Link>
          </section>
        ) : null}
      </div>
    </div>
  )
}
