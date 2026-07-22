import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import type {
  CourseType,
  GraduationProgress,
  RecommendedCourse,
  Enrollment,
} from '@/types/api'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { CourseCard } from '@/components/courses/CourseCard'
import { CourseFilters } from '@/components/courses/CourseFilters'
import { GraduationCard } from '@/components/graduation/GraduationCard'
import { DateStrip } from '@/components/schedule/DateStrip'
import { DayClassList } from '@/components/schedule/DayClassList'
import { AssignmentsExamsRow } from '@/components/schedule/AssignmentsExamsRow'
import { MonthCalendar } from '@/components/schedule/MonthCalendar'
import { MonthDaySchedule } from '@/components/schedule/MonthDaySchedule'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronRight,
  Info,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { COURSE_SCHEDULES } from '@/data/courseSchedules'
import {
  getClassDayNumbers,
  getClassesForDay,
  getWeekdayOptions,
  slotsOverlap,
  toTimetableDay,
} from '@/utils/timetable'

const CARD_SHADOW = '0 10px 28px rgba(15,23,42,0.06)'

export function AcademicPage() {
  const { user } = useAuth()
  const { locale, t } = useLanguage()
  const [viewTab, setViewTab] = useState<'CURRICULUM' | 'TIMETABLE'>('TIMETABLE')
  const [allFilter, setAllFilter] = useState<CourseType | 'ALL'>('ALL')
  const [allCourses, setAllCourses] = useState<RecommendedCourse[]>([])
  const [progress, setProgress] = useState<GraduationProgress | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [collisionError, setCollisionError] = useState<string | null>(null)
  const [now] = useState(() => new Date())
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [monthView, setMonthView] = useState(false)

  const weekDays = useMemo(() => getWeekdayOptions(anchorDate), [anchorDate])

  const classDays = useMemo(
    () =>
      getClassDayNumbers(
        enrollments,
        anchorDate.getFullYear(),
        anchorDate.getMonth(),
      ),
    [enrollments, anchorDate],
  )

  function selectCalendarDate(date: Date) {
    const next = new Date(date)
    next.setHours(12, 0, 0, 0)
    setAnchorDate(next)
  }

  function shiftWeek(delta: number) {
    const next = new Date(anchorDate)
    next.setDate(next.getDate() + delta * 7)
    selectCalendarDate(next)
  }

  function shiftMonth(delta: number) {
    const base = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + delta, 1)
    const keepDay = Math.min(
      anchorDate.getDate(),
      new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate(),
    )
    selectCalendarDate(new Date(base.getFullYear(), base.getMonth(), keepDay))
  }

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const [courses, graduation, timetable] = await Promise.all([
        api.getRecommendedCourses('ALL'),
        api.getGraduationProgress(),
        api.getEnrollments(user.studentId),
      ])
      setAllCourses(courses)
      setProgress(graduation)
      setEnrollments(timetable)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('academic.loadError')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const filteredAllCourses = useMemo(() => {
    if (allFilter === 'ALL') return allCourses
    return allCourses.filter((course) => course.type === allFilter)
  }, [allCourses, allFilter])

  const selectedDate = useMemo(() => {
    const d = new Date(anchorDate)
    d.setHours(0, 0, 0, 0)
    return d
  }, [anchorDate])

  const timetableDay = toTimetableDay(selectedDate.getDay())

  const dayClasses = useMemo(
    () =>
      timetableDay === 0
        ? []
        : getClassesForDay(enrollments, timetableDay, selectedDate, now),
    [enrollments, timetableDay, selectedDate, now],
  )

  const handleAddToTimetable = async (course: RecommendedCourse) => {
    if (!user) return
    setCollisionError(null)
    setSubmittingId(Number(course.id))

    const newSlots = COURSE_SCHEDULES[Number(course.id)] || []
    let conflictFound = false
    let conflictingCourseName = ''

    for (const enrollment of enrollments) {
      const existingSlots = COURSE_SCHEDULES[Number(enrollment.course_id)] || []
      for (const newSlot of newSlots) {
        for (const existingSlot of existingSlots) {
          if (slotsOverlap(newSlot, existingSlot)) {
            conflictFound = true
            conflictingCourseName = enrollment.course_name || 'Enrolled Course'
            break
          }
        }
        if (conflictFound) break
      }
      if (conflictFound) break
    }

    if (conflictFound) {
      setCollisionError(
        `${t('academic.conflictMessage')} (Overlaps with: ${conflictingCourseName})`,
      )
      setSubmittingId(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    try {
      const newEnrollment = await api.createEnrollment(
        user.studentId,
        Number(course.id),
      )
      setEnrollments((prev) => [...prev, newEnrollment])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add course.'
      setCollisionError(message)
    } finally {
      setSubmittingId(null)
    }
  }

  const handleDropFromTimetable = async (enrollmentId: number) => {
    if (!window.confirm(t('academic.confirmDrop'))) return
    setLoading(true)
    try {
      await api.deleteEnrollment(enrollmentId)
      setEnrollments((prev) =>
        prev.filter((e) => e.enrollment_id !== enrollmentId),
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to drop course.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const profileIncomplete = !user?.major
  const enrollmentForCourse = (courseId: string) =>
    enrollments.find((e) => Number(e.course_id) === Number(courseId))

  const dayLabel = selectedDate.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="pb-8">
      {viewTab === 'TIMETABLE' ? (
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div className="min-w-0">
            <h1 className="text-[16px] font-bold tracking-tight text-pnu-text">
              {t('schedule.title')}
            </h1>
          </div>
          <Link
            to="/academic-calendar"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-pnu-blue/10 px-3 py-2 text-[12px] font-semibold text-pnu-blue transition active:scale-[0.98]"
          >
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="max-w-[7.5rem] truncate">{t('home.academicCalendar')}</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-70" strokeWidth={2.2} />
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-pnu-text">
              {t('academic.curriculum')}
            </h1>
            <p className="mt-0.5 text-[12px] font-medium text-pnu-muted">
              {t('academic.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setViewTab('TIMETABLE')}
            className="inline-flex items-center gap-1 rounded-full bg-pnu-blue/10 px-3 py-1.5 text-[12px] font-semibold text-pnu-blue"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {t('schedule.title')}
          </button>
        </div>
      )}

      <div className="space-y-4 px-4 py-4">
        {profileIncomplete ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <span>{t('academic.profileIncomplete')}</span>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        ) : null}

        {collisionError ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div className="flex-1">
              <p className="font-bold">{t('academic.conflictTitle')}</p>
              <p className="mt-0.5 text-xs font-medium text-rose-600">
                {collisionError}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCollisionError(null)}
              className="rounded border border-rose-300 px-1.5 py-0.5 text-xs font-semibold text-rose-800"
            >
              {t('common.clear')}
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-pnu-muted">
            <RefreshCw className="h-6 w-6 animate-spin text-pnu-blue" />
            <p className="text-sm font-medium">{t('academic.loading')}</p>
          </div>
        ) : null}

        {!loading && viewTab === 'CURRICULUM' ? (
          <div className="space-y-6">
            {progress ? (
              <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-pnu-text">
                  {t('academic.completedCredits')}
                </h3>
                <GraduationCard progress={progress} />
              </section>
            ) : null}

            <section className="space-y-4">
              <h3 className="text-base font-bold tracking-tight text-pnu-text">
                {t('academic.allCourses')}
              </h3>
              <CourseFilters value={allFilter} onChange={setAllFilter} />

              {filteredAllCourses.length === 0 ? (
                <p className="py-4 text-sm text-pnu-muted">{t('academic.noCourses')}</p>
              ) : null}

              <div className="space-y-3.5">
                {filteredAllCourses.map((course) => {
                  const enrollment = enrollmentForCourse(course.id)
                  return (
                    <CourseCard
                      key={`all-${course.id}`}
                      course={course}
                      action={
                        enrollment ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleDropFromTimetable(enrollment.enrollment_id)
                            }
                            className="inline-flex items-center gap-1 rounded-xl border border-emerald-100/60 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-600"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                            {t('academic.enrolled')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToTimetable(course)}
                            disabled={submittingId === Number(course.id)}
                            className="flex items-center justify-center gap-1 rounded-xl bg-pnu-blue p-2 text-xs font-bold text-white shadow-md transition-all hover:bg-pnu-blue-light active:scale-95 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                            {t('academic.addToTimetable')}
                          </button>
                        )
                      }
                    />
                  )
                })}
              </div>
            </section>
          </div>
        ) : null}

        {!loading && viewTab === 'TIMETABLE' ? (
          <div className="space-y-3.5">
            <DateStrip
              days={weekDays}
              selectedDate={selectedDate}
              locale={locale}
              monthView={monthView}
              onSelectDate={selectCalendarDate}
              onShiftWeek={shiftWeek}
              onToggleMonthView={() => setMonthView((open) => !open)}
            />

            {monthView ? (
              <>
                <MonthCalendar
                  year={anchorDate.getFullYear()}
                  month={anchorDate.getMonth()}
                  selectedDate={selectedDate}
                  classDays={classDays}
                  onSelectDate={selectCalendarDate}
                  onShiftMonth={shiftMonth}
                />
                <MonthDaySchedule
                  date={selectedDate}
                  classes={dayClasses}
                  locale={locale}
                  onViewFullSchedule={() => setMonthView(false)}
                />
              </>
            ) : (
              <section
                className="rounded-[20px] bg-white px-3.5 py-3.5 ring-1 ring-black/5"
                style={{ boxShadow: CARD_SHADOW }}
              >
                <div className="mb-1 flex items-center gap-2 px-0.5">
                  <CalendarDays className="h-4 w-4 shrink-0 text-pnu-blue" strokeWidth={2} />
                  <h2 className="text-[14px] font-bold tracking-tight text-pnu-text">
                    {dayLabel}
                  </h2>
                </div>

                <DayClassList classes={dayClasses} embedded />
                <AssignmentsExamsRow embedded />
              </section>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
