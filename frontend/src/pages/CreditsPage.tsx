import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  ChevronDown,
} from 'lucide-react'
import { api } from '@/api'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import type { Enrollment, GraduationProgress } from '@/types/api'
import { demoGpa, demoLetterGrade } from '@/utils/demoGrades'

const CARD_SHADOW = '0 8px 24px rgba(15,23,42,0.06)'
const ACCENT = '#7C3AED'
const ACCENT_SOFT = '#F3E8FF'

function sumBucket(
  progress: GraduationProgress,
  keys: Array<keyof GraduationProgress['breakdown']>,
) {
  return keys.reduce(
    (acc, key) => ({
      completed: acc.completed + progress.breakdown[key].completed,
      required: acc.required + progress.breakdown[key].required,
    }),
    { completed: 0, required: 0 },
  )
}

function ProgressRing({
  percent,
  completedLabel,
}: {
  percent: number
  completedLabel: string
}) {
  const size = 64
  const stroke = 5.5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100)

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ACCENT_SOFT}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ACCENT}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[12px] font-bold leading-none text-[#7C3AED]">{percent}%</span>
        <span className="mt-0.5 text-[8px] font-semibold text-pnu-muted">
          {completedLabel}
        </span>
      </div>
    </div>
  )
}

function BreakdownBar({
  label,
  completed,
  required,
}: {
  label: string
  completed: number
  required: number
}) {
  const pct = required > 0 ? Math.min(100, Math.round((completed / required) * 100)) : 0

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold text-pnu-text">{label}</p>
        <p className="text-[12px] font-bold text-[#7C3AED]">
          {completed}
          <span className="font-medium text-pnu-muted"> / {required}</span>
        </p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[#F3E8FF]"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={required}
      >
        <div
          className="h-full rounded-full bg-[#7C3AED] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function CreditsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [progress, setProgress] = useState<GraduationProgress | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [certificateDone, setCertificateDone] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const enrollmentPromise = user
      ? api.getEnrollments(user.studentId).catch(() => [] as Enrollment[])
      : Promise.resolve([] as Enrollment[])

    Promise.all([api.getGraduationProgress().catch(() => null), enrollmentPromise])
      .then(([grad, enrolls]) => {
        if (cancelled) return
        setProgress(grad)
        setEnrollments(enrolls)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const buckets = useMemo(() => {
    if (!progress) return null
    return {
      genEd: sumBucket(progress, ['generalRequired', 'generalElective']),
      major: sumBucket(progress, ['majorBasic', 'majorRequired']),
      elective: sumBucket(progress, ['majorElective', 'generalFree']),
    }
  }, [progress])

  const gradeSummary = useMemo(() => {
    const ids = enrollments.map((e) => e.course_id)
    const gpa = demoGpa(ids)
    const majorIds = ids.filter((_, i) => i % 2 === 0)
    const majorGpa = demoGpa(majorIds.length > 0 ? majorIds : ids)
    const avgLetter =
      ids.length > 0 ? demoLetterGrade(ids[0]).letter : '—'
    const semesterCredits = enrollments
      .filter((e) => {
        const s = e.status.toLowerCase()
        return !s.includes('complete') && !s.includes('passed')
      })
      .reduce((sum, e) => sum + (e.credit ?? 0), 0)

    return {
      cumulativeGpa: gpa === '—' ? '3.50' : gpa,
      majorGpa: majorGpa === '—' ? '3.62' : majorGpa,
      averageGrade: avgLetter === '—' ? 'A-' : avgLetter,
      semesterCredits: semesterCredits || 12,
    }
  }, [enrollments])

  const checklist = useMemo(
    () => [
      { id: 'topik', labelKey: 'credits.checkTopik' },
      { id: 'enrollment', labelKey: 'credits.checkEnrollmentCert' },
      { id: 'transcript', labelKey: 'credits.checkTranscript' },
      { id: 'graduation', labelKey: 'credits.checkGraduationCert' },
    ],
    [],
  )

  const checklistDoneCount = checklist.filter((item) => certificateDone[item.id]).length

  function toggleCertificateItem(id: string) {
    setCertificateDone((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const percent =
    progress && progress.totalRequired > 0
      ? Math.round((progress.totalCompleted / progress.totalRequired) * 100)
      : 0

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
        {loading || !progress || !buckets ? (
          <p className="rounded-[14px] bg-white px-3 py-8 text-center text-[12px] text-pnu-muted"
            style={{ boxShadow: CARD_SHADOW }}
          >
            {t('common.loading')}
          </p>
        ) : (
          <>
            <section
              className="rounded-[14px] bg-white px-3 py-2.5"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <p className="text-[11px] font-semibold text-pnu-text">
                {t('credits.totalEarned')}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[22px] font-bold leading-none tracking-tight text-[#7C3AED]">
                    {progress.totalCompleted}
                    <span className="text-[14px] font-semibold text-pnu-muted">
                      {' '}
                      / {progress.totalRequired}
                    </span>
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-pnu-muted">
                    {t('credits.creditsUnit')}
                  </p>
                </div>
                <ProgressRing percent={percent} completedLabel={t('credits.completed')} />
              </div>
            </section>

            <section
              className="rounded-[14px] bg-white px-3.5 py-3"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <p className="mb-3 text-[12px] font-bold text-pnu-text">
                {t('credits.breakdown')}
              </p>
              <div className="space-y-3">
                <BreakdownBar
                  label={t('credits.genEd')}
                  completed={buckets.genEd.completed}
                  required={buckets.genEd.required}
                />
                <BreakdownBar
                  label={t('credits.major')}
                  completed={buckets.major.completed}
                  required={buckets.major.required}
                />
                <BreakdownBar
                  label={t('credits.electives')}
                  completed={buckets.elective.completed}
                  required={buckets.elective.required}
                />
              </div>
            </section>

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
                  {checklistDoneCount}/{checklist.length}
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
                  {checklist.map((item) => {
                    const done = Boolean(certificateDone[item.id])
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => toggleCertificateItem(item.id)}
                          className="flex w-full items-center gap-2.5 py-2.5 text-left transition active:bg-black/[0.02]"
                        >
                          <span
                            className={[
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition',
                              done
                                ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                                : 'border-black/20 bg-white',
                            ].join(' ')}
                            aria-hidden="true"
                          >
                            {done ? (
                              <Check className="h-3 w-3" strokeWidth={3} />
                            ) : null}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-pnu-text">
                              {t(item.labelKey)}
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
                  })}
                </ul>
              ) : null}
            </section>

            <section
              className="rounded-[14px] bg-white px-3 py-2.5"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <p className="mb-2 text-[12px] font-bold text-pnu-text">
                {t('credits.gradeSummary')}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  {
                    labelKey: 'credits.cumulativeGpa',
                    value: gradeSummary.cumulativeGpa,
                    accent: true,
                  },
                  {
                    labelKey: 'credits.majorGpa',
                    value: gradeSummary.majorGpa,
                    accent: false,
                  },
                  {
                    labelKey: 'credits.averageGrade',
                    value: gradeSummary.averageGrade,
                    accent: true,
                  },
                  {
                    labelKey: 'credits.semesterCredits',
                    value: String(gradeSummary.semesterCredits),
                    accent: false,
                  },
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
