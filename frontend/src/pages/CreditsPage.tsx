import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  GraduationCap,
} from 'lucide-react'
import { api } from '@/api'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { emitToast } from '@/context/ToastContext'
import type {
  Enrollment,
  GraduationProgress,
  GraduationRequirementItem,
} from '@/types/api'

const CARD_SHADOW = '0 8px 24px rgba(15,23,42,0.06)'
const ACCENT = '#7C3AED'

const CATEGORY_COLORS = [
  { bg: '#EDE9FE', bar: '#7C3AED', icon: '#DDD6FE' },
  { bg: '#DBEAFE', bar: '#3B82F6', icon: '#BFDBFE' },
  { bg: '#D1FAE5', bar: '#10B981', icon: '#A7F3D0' },
  { bg: '#FEF3C7', bar: '#F59E0B', icon: '#FDE68A' },
  { bg: '#FCE7F3', bar: '#EC4899', icon: '#FBCFE8' },
  { bg: '#E0F2FE', bar: '#0EA5E9', icon: '#BAE6FD' },
  { bg: '#FEE2E2', bar: '#EF4444', icon: '#FECACA' },
  { bg: '#F0FDF4', bar: '#22C55E', icon: '#BBF7D0' },
]


function mapReqCodeToBucket(code: string): keyof GraduationProgress['breakdown'] | null {
  if (code === 'MAJOR_BASIC') return 'majorBasic'
  if (code === 'MAJOR_REQUIRED') return 'majorRequired'
  if (code === 'MAJOR_ELECTIVE') return 'majorElective'
  if (code === 'GENERAL_REQUIRED') return 'generalRequired'
  if (['GENERAL_ELECTIVE', 'LIBERAL_ELECTIVE', 'HYOWON_CORE', 'HYOWON_BALANCE', 'HYOWON_CREATIVE'].includes(code)) return 'generalElective'
  if (['GENERAL_FREE', 'FREE_ELECTIVE'].includes(code)) return 'generalFree'
  return null
}

function SemiArc({ percent }: { percent: number }) {
  const W = 180
  const H = 100
  const cx = W / 2
  const cy = H - 4
  const r = 80
  const strokeW = 14
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const describeArc = (startDeg: number, endDeg: number) => {
    const sx = cx + r * Math.cos(toRad(startDeg))
    const sy = cy + r * Math.sin(toRad(startDeg))
    const ex = cx + r * Math.cos(toRad(endDeg))
    const ey = cy + r * Math.sin(toRad(endDeg))
    return `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`
  }

  const clampedPct = Math.min(100, Math.max(0, percent))
  const activeEnd = 180 - (clampedPct / 100) * 180

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <path
        d={describeArc(180, 0)}
        fill="none"
        stroke="#EDE9FE"
        strokeWidth={strokeW}
        strokeLinecap="round"
      />
      {clampedPct > 0 && (
        <path
          d={describeArc(180, activeEnd)}
          fill="none"
          stroke={ACCENT}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

function CategoryCard({
  item,
  completed,
  colorIdx,
}: {
  item: GraduationRequirementItem
  completed: number
  colorIdx: number
}) {
  const color = CATEGORY_COLORS[colorIdx % CATEGORY_COLORS.length]
  const target = item.targetValue || 0
  const pct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0

  return (
    <div
      className="flex-none w-[108px] rounded-[14px] p-2.5"
      style={{ background: color.bg }}
    >
      <div
        className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px]"
        style={{ background: color.icon }}
      >
        <GraduationCap className="h-4 w-4" style={{ color: color.bar }} strokeWidth={2} />
      </div>
      <p className="mb-1.5 line-clamp-2 text-[10px] font-bold leading-tight text-gray-700">
        {item.title}
      </p>
      <p className="mb-1.5 text-[11px] font-semibold leading-none" style={{ color: color.bar }}>
        {completed}
        <span className="font-medium text-gray-400"> / {target}</span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/60">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color.bar }}
        />
      </div>
      <p className="mt-1 text-[9px] font-semibold" style={{ color: color.bar }}>
        {pct}%
      </p>
    </div>
  )
}

export function CreditsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [progress, setProgress] = useState<GraduationProgress | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [requirements, setRequirements] = useState<GraduationRequirementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [activeDot, setActiveDot] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const enrollmentPromise = user
      ? api.getEnrollments(user.studentId).catch(() => [] as Enrollment[])
      : Promise.resolve([] as Enrollment[])

    Promise.all([
      api.getGraduationProgress().catch(() => null),
      enrollmentPromise,
    ])
      .then(([grad, enrolls]) => {
        if (cancelled) return
        setProgress(grad)
        setEnrollments(enrolls)
        setRequirements(grad?.requirements ?? [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const gradeSummary = useMemo(() => {
    const summary = progress?.gradeSummary
    const formatGpa = (value: number | null | undefined) =>
      value == null || Number.isNaN(value) ? '—' : value.toFixed(2)

    const semesterCreditsFromEnrollments = enrollments
      .filter((e) => {
        const s = e.status.toLowerCase()
        return !s.includes('complete') && !s.includes('passed')
      })
      .reduce((sum, e) => sum + (e.credit ?? 0), 0)

    return {
      cumulativeGpa: formatGpa(summary?.overallGpa),
      majorGpa: formatGpa(summary?.majorGpa),
      averageGrade: summary?.averageLetter ?? '—',
      semesterCredits:
        summary?.semesterCredits && summary.semesterCredits > 0
          ? summary.semesterCredits
          : semesterCreditsFromEnrollments,
    }
  }, [progress, enrollments])

  const creditItems = useMemo(
    () => requirements.filter((item) => item.requirementType === 'CREDIT'),
    [requirements],
  )

  const checklistDoneCount = requirements.filter((item) => {
    if (item.requirementType === 'CREDIT' && progress && item.requirementCode && typeof item.targetValue === 'number') {
      const b = mapReqCodeToBucket(item.requirementCode)
      if (b) return (progress.breakdown[b]?.completed ?? 0) >= item.targetValue
    }
    return item.completed
  }).length

  async function toggleRequirement(id: string, completed: boolean) {
    setUpdatingId(id)
    try {
      const updated = await api.updateGraduationRequirement(id, completed)
      setRequirements((prev) =>
        prev.map((item) => (item.id === id ? updated : item)),
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const percent =
    progress && progress.totalRequired > 0
      ? Math.round((progress.totalCompleted / progress.totalRequired) * 100)
      : 0

  const remaining = progress ? Math.max(0, progress.totalRequired - progress.totalCompleted) : 0

  const CARDS_PER_PAGE = 3
  const totalDots = Math.max(1, Math.ceil(creditItems.length / CARDS_PER_PAGE))

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    const dot = maxScroll > 0 ? Math.round((el.scrollLeft / maxScroll) * (totalDots - 1)) : 0
    setActiveDot(dot)
  }

  // keep sumBucket referenced so no unused-import warning
  void sumBucket

  return (
    <div className="min-h-full bg-[#F5F7FB]">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-[#F5F7FB]/95 px-3 py-2 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg p-1 text-pnu-text transition hover:bg-black/5"
          aria-label={t('common.goBack')}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <h1 className="text-[15px] font-bold tracking-tight text-pnu-text">
          {t('credits.title')}
        </h1>
        <span className="h-8 w-8" aria-hidden="true" />
      </header>

      <div className="space-y-3 px-3 pb-5 pt-0.5">
        {loading || !progress ? (
          <p
            className="rounded-[14px] bg-white px-3 py-8 text-center text-[12px] text-pnu-muted"
            style={{ boxShadow: CARD_SHADOW }}
          >
            {t('common.loading')}
          </p>
        ) : (
          <>
            {/* ── Unified Graduation Progress Card ── */}
            <section
              className="rounded-[20px] bg-white px-4 pt-4 pb-3"
              style={{ boxShadow: CARD_SHADOW }}
            >
              {/* Header */}
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[13px] font-bold text-pnu-text">{t('credits.breakdown')}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDE9FE]">
                  <GraduationCap className="h-4 w-4 text-[#7C3AED]" strokeWidth={2} />
                </div>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-pnu-muted">{t('credits.officialGradeNotice')}</p>
              <a href="https://onestop.pusan.ac.kr/page?menuCD=000000000000093" target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[10px] font-bold text-pnu-blue underline">{t('credits.openOfficialGrades')}</a>
            </section>

              {/* Arc + labels */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <SemiArc percent={percent} />
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-[26px] font-extrabold leading-none text-[#7C3AED]">{percent}%</p>
                    <p className="text-[10px] font-semibold text-gray-400">{t('credits.completed')}</p>
                  </div>
                </div>

                <p className="mt-1 text-[18px] font-bold leading-none text-pnu-text">
                  <span className="text-[#7C3AED]">{progress.totalCompleted}</span>
                  <span className="text-[14px] font-medium text-gray-400"> / {progress.totalRequired} Credits</span>
                </p>
                <p className="mt-1 text-[11px] font-medium text-gray-400">
                  {remaining} credits remaining to graduate
                </p>
              </div>

              {/* Horizontally scrollable category cards */}
              {creditItems.length > 0 && (
                <div className="mt-4">
                  <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-2.5 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {creditItems.map((item, idx) => {
                      let completed = 0
                      if (item.requirementCode) {
                        const bn = mapReqCodeToBucket(item.requirementCode)
                        if (bn) completed = progress.breakdown[bn]?.completed ?? 0
                      }
                      return (
                        <CategoryCard
                          key={item.id}
                          item={item}
                          completed={completed}
                          colorIdx={idx}
                        />
                      )
                    })}
                  </div>

                  {/* Pagination dots */}
                  {totalDots > 1 && (
                    <div className="mt-2.5 flex justify-center gap-1.5">
                      {Array.from({ length: totalDots }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: i === activeDot ? 16 : 6,
                            height: 6,
                            background: i === activeDot ? ACCENT : '#DDD6FE',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── Graduation Checklist ── */}
            <section
              className="overflow-hidden rounded-[14px] bg-white"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <button
                type="button"
                onClick={() => setChecklistOpen((open) => !open)}
                className="flex w-full items-center gap-2 px-3.5 py-3 text-left transition active:bg-black/[0.02]"
                aria-expanded={checklistOpen}
              >
                <p className="min-w-0 flex-1 text-[12px] font-bold text-pnu-text">
                  {t('credits.checklist')}
                </p>
                <span className="text-[10px] font-semibold text-pnu-muted">
                  {checklistDoneCount}/{requirements.length}
                </span>
                <ChevronDown
                  className={[
                    'h-4 w-4 shrink-0 text-pnu-muted transition-transform duration-200',
                    checklistOpen ? 'rotate-180' : '',
                  ].join(' ')}
                  strokeWidth={2}
                />
              </button>

              {checklistOpen ? (
                <ul className="divide-y divide-black/6 border-t border-black/6 px-3.5 pb-2">
                  {requirements.length === 0 ? (
                    <li className="py-3 text-[12px] text-pnu-muted">{t('home.noChecklist')}</li>
                  ) : (
                    requirements.map((item) => {
                      const isCredit = item.requirementType === 'CREDIT'
                      let done = item.completed

                      if (isCredit && progress && item.requirementCode && typeof item.targetValue === 'number') {
                        const bucketName = mapReqCodeToBucket(item.requirementCode)
                        if (bucketName) {
                          const bucket = progress.breakdown[bucketName]
                          if (bucket) {
                            done = bucket.completed >= item.targetValue
                          }
                        }
                      }

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            disabled={updatingId === item.id}
                            onClick={() => {
                              if (isCredit) {
                                if (!done) {
                                  emitToast("You haven't completed the required credits", 'error')
                                }
                                return
                              }
                              void toggleRequirement(item.id, !done)
                            }}
                            className={[
                              'flex w-full items-center gap-2.5 py-2.5 text-left transition',
                              isCredit && done ? 'cursor-default' : 'active:bg-black/[0.02] disabled:opacity-60',
                            ].join(' ')}
                          >
                            <span
                              className={[
                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition',
                                done
                                  ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                                  : 'border-black/20 bg-white',
                                isCredit && !done ? 'bg-black/5' : '',
                              ].join(' ')}
                              aria-hidden="true"
                            >
                              {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-semibold text-pnu-text">
                                {item.title}
                              </p>
                            </div>
                            <span
                              className={[
                                'shrink-0 text-[11px] font-bold',
                                done ? 'text-[#16A34A]' : 'text-[#7C3AED]',
                              ].join(' ')}
                            >
                              {done ? t('credits.certDone') : t('credits.certPending')}
                            </span>
                          </button>
                        </li>
                      )
                    })
                  )}
                </ul>
              ) : null}
            </section>

            {/* ── Grade Summary ── */}
            <section
              className="rounded-[14px] bg-white px-3 py-2.5"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <p className="mb-2 text-[12px] font-bold text-pnu-text">
                {t('credits.gradeSummary')}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { labelKey: 'credits.cumulativeGpa', value: gradeSummary.cumulativeGpa, accent: true },
                  { labelKey: 'credits.majorGpa', value: gradeSummary.majorGpa, accent: false },
                  { labelKey: 'credits.averageGrade', value: gradeSummary.averageGrade, accent: true },
                  { labelKey: 'credits.semesterCredits', value: String(gradeSummary.semesterCredits), accent: false },
                ].map(({ labelKey, value, accent }) => (
                  <div
                    key={labelKey}
                    className="flex min-h-[72px] flex-col items-center justify-center rounded-[12px] bg-[#F5F7FB] px-1 py-2 text-center"
                  >
                    <p
                      className={[
                        'text-[16px] font-bold leading-none tracking-tight',
                        accent ? 'text-[#7C3AED]' : 'text-pnu-text',
                      ].join(' ')}
                    >
                      {value}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-[9px] font-semibold leading-tight text-pnu-text">
                      {t(labelKey)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
