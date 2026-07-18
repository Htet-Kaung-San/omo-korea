import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronRight,
  Code2,
  Database,
  Languages,
  Monitor,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { api } from '@/api'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { getCourseSchedule } from '@/data/courseSchedules'
import type { Enrollment } from '@/types/api'

type CoursesTab = 'current' | 'all' | 'past'

const COURSE_ICONS: LucideIcon[] = [Code2, Brain, Monitor, Database, Languages, BookOpen]
const ICON_TONES = [
  'bg-[#E8F3FF] text-pnu-blue',
  'bg-[#F3E8FF] text-[#AF52DE]',
  'bg-[#E8F8ED] text-[#248A3D]',
  'bg-[#FFF4E5] text-[#C77700]',
  'bg-[#FFE8EC] text-[#FF2D55]',
  'bg-[#E8F8F5] text-[#0D9488]',
]

const CARD_SHADOW = '0 8px 24px rgba(15,23,42,0.06)'

function isCompletedStatus(status: string) {
  const s = status.toLowerCase()
  return s.includes('complete') || s.includes('passed') || s === 'done'
}

function isActiveStatus(status: string) {
  const s = status.toLowerCase()
  if (isCompletedStatus(s)) return false
  if (!s) return true
  return (
    s.includes('enroll') ||
    s.includes('active') ||
    s.includes('progress') ||
    s.includes('register') ||
    s.includes('current')
  )
}

function formatSchedule(courseId: number): string {
  const slots = getCourseSchedule(courseId)
  if (slots.length === 0) return '—'
  const days = [...new Set(slots.map((s) => s.dayLabel))].join(' / ')
  const time = `${slots[0].start} – ${slots[0].end}`
  return `${days} ${time}`
}

export function CoursesDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [tab, setTab] = useState<CoursesTab>('current')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    api
      .getEnrollments(user.studentId)
      .then(setEnrollments)
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false))
  }, [user])

  const activeEnrollments = useMemo(() => {
    const active = enrollments.filter((e) => isActiveStatus(e.status))
    return active.length > 0 ? active : enrollments.filter((e) => !isCompletedStatus(e.status))
  }, [enrollments])

  const completedEnrollments = useMemo(
    () => enrollments.filter((e) => isCompletedStatus(e.status)),
    [enrollments],
  )

  const listForTab = useMemo(() => {
    if (tab === 'past') return completedEnrollments
    if (tab === 'all') return enrollments
    return activeEnrollments.length > 0 ? activeEnrollments : enrollments
  }, [tab, activeEnrollments, completedEnrollments, enrollments])

  const enrolledCount = activeEnrollments.length || enrollments.length
  const semesterCredits = useMemo(
    () =>
      (activeEnrollments.length > 0 ? activeEnrollments : enrollments).reduce(
        (sum, e) => sum + (e.credit ?? 0),
        0,
      ),
    [activeEnrollments, enrollments],
  )

  const tabs: { id: CoursesTab; labelKey: string }[] = [
    { id: 'current', labelKey: 'courses.tabCurrent' },
    { id: 'all', labelKey: 'courses.tabAll' },
    { id: 'past', labelKey: 'courses.tabPast' },
  ]

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
          {t('courses.title')}
        </h1>
        <Link
          to="/academic/recommended-courses"
          className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#E8F3FF] text-pnu-blue transition active:scale-[0.96]"
          aria-label={t('courses.openCatalog')}
        >
          <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </header>

      <div className="space-y-3 px-3 pb-5 pt-0.5">
        <section>
          <h2 className="mb-1.5 px-0.5 text-[12px] font-bold text-pnu-text">
            {t('courses.overview')}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div
              className="rounded-[14px] bg-white px-3 py-2.5"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-medium text-pnu-muted">
                    {t('courses.enrolledCourses')}
                  </p>
                  <p className="mt-1 text-[22px] font-bold leading-none tracking-tight text-pnu-text">
                    {enrolledCount}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-pnu-muted">
                    {t('courses.coursesUnit')}
                  </p>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#E8F3FF] text-pnu-blue">
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              </div>
            </div>

            <div
              className="rounded-[14px] bg-white px-3 py-2.5"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-medium text-pnu-muted">
                    {t('courses.thisSemester')}
                  </p>
                  <p className="mt-1 text-[22px] font-bold leading-none tracking-tight text-pnu-text">
                    {semesterCredits}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-pnu-muted">
                    {t('courses.creditsUnit')}
                  </p>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#E8F3FF] text-pnu-blue">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex gap-3.5 border-b border-black/8 px-0.5">
          {tabs.map(({ id, labelKey }) => {
            const active = tab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={[
                  '-mb-px border-b-2 pb-1.5 text-[11px] font-semibold transition',
                  active
                    ? 'border-pnu-blue text-pnu-blue'
                    : 'border-transparent text-pnu-muted',
                ].join(' ')}
              >
                {t(labelKey)}
              </button>
            )
          })}
        </div>

        <section
          className="overflow-hidden rounded-[14px] bg-white"
          style={{ boxShadow: CARD_SHADOW }}
        >
          {loading ? (
            <p className="px-3 py-8 text-center text-[12px] text-pnu-muted">
              {t('common.loading')}
            </p>
          ) : listForTab.length === 0 ? (
            <p className="px-3 py-8 text-center text-[12px] text-pnu-muted">
              {t('courses.emptyList')}
            </p>
          ) : (
            <ul className="divide-y divide-black/6">
              {listForTab.map((enrollment, index) => {
                const Icon = COURSE_ICONS[index % COURSE_ICONS.length]
                const iconTone = ICON_TONES[index % ICON_TONES.length]
                const code = `CSE${String(100 + (enrollment.course_id % 900)).padStart(3, '0')}`

                return (
                  <li key={enrollment.enrollment_id}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${iconTone}`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.85} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-pnu-blue">{code}</p>
                        <p className="truncate text-[13px] font-bold text-pnu-text">
                          {enrollment.course_name || t('courses.untitled')}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-pnu-muted">
                          {t('courses.professorUnknown')}
                          {enrollment.classroom ? ` · ${enrollment.classroom}` : ''}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-pnu-muted">
                          <CalendarDays className="h-2.5 w-2.5 shrink-0 text-pnu-blue/70" />
                          <span className="truncate">
                            {formatSchedule(enrollment.course_id)}
                          </span>
                        </p>
                      </div>

                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-pnu-muted/35" />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <Link
          to="/academic/recommended-courses"
          className="flex w-full items-center gap-2.5 rounded-[14px] bg-white px-3 py-2.5 text-left transition active:scale-[0.99]"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F3E8FF] text-[#7C3AED]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-bold text-pnu-text">
            {t('courses.aiRecommendation')}
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-pnu-muted/40" />
        </Link>
      </div>
    </div>
  )
}
