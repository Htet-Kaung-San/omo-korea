import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, CalendarDays, Check, ChevronRight, Pencil, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import { api } from '@/api'
import { AddPastCourseModal } from '@/components/courses/AddPastCourseModal'
import { EditPastCourseModal } from '@/components/courses/EditPastCourseModal'
import { CourseTermSelector } from '@/components/courses/CourseTermSelector'
import { AddTimetableModal } from '@/components/schedule/AddTimetableModal'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import type { CourseCatalogItem, CourseType, CreateTimetableEntryInput, Enrollment } from '@/types/api'
import { currentCourseTerm, enrollmentSemester, type CourseTerm } from '@/utils/courseTerm'
import { formatMajorName } from '@/utils/formatMajor'

type CoursesTab = 'current' | 'all' | 'offered' | 'past'
const CARD_SHADOW = '0 8px 24px rgba(15,23,42,0.06)'

function isCompletedStatus(status: string) {
  const normalized = String(status || '').toLowerCase()
  return normalized.includes('complete') || normalized.includes('passed') || normalized === 'done'
}

function termRank(value: string) {
  const match = String(value || '').match(/^(\d{4})-(Spring|Summer|Fall|Winter)$/i)
  if (!match) return null
  const order: Record<string, number> = { spring: 1, summer: 2, fall: 3, winter: 4 }
  return Number(match[1]) * 10 + order[match[2].toLowerCase()]
}

function currentTermRank(now = new Date()) {
  return now.getFullYear() * 10 + (now.getMonth() + 1 >= 7 ? 3 : 1)
}

function isPastEnrollment(enrollment: Enrollment) {
  if (isCompletedStatus(enrollment.status)) return true
  const rank = termRank(enrollment.semester)
  return rank != null && rank < currentTermRank()
}

function formatSchedule(enrollment: Enrollment): string {
  if (enrollment.schedule) return enrollment.schedule
  if (!enrollment.day_of_week || !enrollment.start_time || !enrollment.end_time) {
    return 'Schedule unavailable'
  }
  return `${enrollment.day_of_week} ${enrollment.start_time.slice(0, 5)} – ${enrollment.end_time.slice(0, 5)}`
}

export function CoursesDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [tab, setTab] = useState<CoursesTab>('current')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [catalog, setCatalog] = useState<CourseCatalogItem[]>([])
  const [catalogPage, setCatalogPage] = useState(1)
  const [catalogTotal, setCatalogTotal] = useState(0)
  const [catalogHasMore, setCatalogHasMore] = useState(false)
  const [query, setQuery] = useState('')
  const [catalogCategory, setCatalogCategory] = useState<CourseType | 'ALL'>('ALL')
  const [recommendedYear, setRecommendedYear] = useState<number | undefined>()
  // Defaults to the student's own major. Opening the catalogue on "All majors"
  // meant the first thing a student saw was 1,924 courses from 116 majors, and
  // the toggle that fixes it looks like a filter you would apply, not one you
  // need to undo. If the student has no major recorded the backend resolves it
  // to null and shows everything, which is the same as before.
  const [myMajorOnly, setMyMajorOnly] = useState(true)
  const [loading, setLoading] = useState(true)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [showAddPast, setShowAddPast] = useState(false)
  const [editingPast, setEditingPast] = useState<Enrollment | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<CourseCatalogItem | null>(null)
  const [timetableCourseIds, setTimetableCourseIds] = useState<Set<number>>(new Set())
  const [term, setTerm] = useState<CourseTerm>(() => currentCourseTerm())
  const [changingCourseId, setChangingCourseId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const academicYear = term.academicYear
  const semester = term.semester

  const loadEnrollments = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      setEnrollments(await api.getEnrollments(user.studentId))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('academic.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t, user])

  useEffect(() => { loadEnrollments() }, [loadEnrollments])

  useEffect(() => {
    api.getTimetable({ academicYear, semester })
      .then((entries) => setTimetableCourseIds(new Set(entries.map((entry) => Number(entry.course_id)))))
      .catch((reason) => setError(reason instanceof Error ? reason.message : t('academic.loadError')))
  }, [academicYear, semester, t])

  useEffect(() => {
    if (tab !== 'all' && tab !== 'offered') return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setCatalogLoading(true)
      setError('')
      try {
        const page = await api.getCourseCatalog({
          page: 1,
          pageSize: 100,
          search: query,
          category: catalogCategory,
          recommendedYear,
          myMajor: myMajorOnly,
          academicYear,
          semester,
          offeredOnly: tab === 'offered',
        })
        if (cancelled) return
        setCatalog(page.items)
        setCatalogPage(page.page)
        setCatalogTotal(page.total)
        setCatalogHasMore(page.hasMore)
      } catch (reason) {
        if (cancelled) return
        setError(reason instanceof Error ? reason.message : t('academic.loadError'))
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [academicYear, catalogCategory, myMajorOnly, query, recommendedYear, semester, t, tab])

  const pastEnrollments = useMemo(() => enrollments.filter(isPastEnrollment), [enrollments])
  const activeEnrollments = useMemo(() => enrollments.filter((item) => !isPastEnrollment(item)), [enrollments])
  const semesterCredits = activeEnrollments.reduce((sum, item) => sum + (item.credit ?? 0), 0)

  const currentCourseIds = useMemo(() => {
    const ids = new Set<number>(timetableCourseIds)
    for (const item of activeEnrollments) {
      if (item.course_id) ids.add(Number(item.course_id))
      if (item.catalog_course_id) ids.add(Number(item.catalog_course_id))
    }
    return ids
  }, [timetableCourseIds, activeEnrollments])

  async function loadMore() {
    const nextPage = catalogPage + 1
    setCatalogLoading(true)
    try {
      const page = await api.getCourseCatalog({
        page: nextPage,
        pageSize: 100,
        search: query,
        category: catalogCategory,
        recommendedYear,
        myMajor: myMajorOnly,
        academicYear,
        semester,
        offeredOnly: tab === 'offered',
      })
      setCatalog((current) => [...current, ...page.items])
      setCatalogPage(page.page)
      setCatalogHasMore(page.hasMore)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('academic.loadError'))
    } finally {
      setCatalogLoading(false)
    }
  }

  async function addCurrentCourse(data: CreateTimetableEntryInput) {
    if (!user) return
    const courseId = Number(data.courseId)
    setChangingCourseId(courseId)
    setError('')
    let createdEnrollment: Enrollment | null = null
    try {
      const alreadyEnrolled = activeEnrollments.some((item) =>
        Number(item.catalog_course_id || item.course_id) === courseId
        && item.semester === enrollmentSemester(term))
      if (!alreadyEnrolled) createdEnrollment = await api.createEnrollment(user.studentId, courseId, enrollmentSemester(term))
      try {
        await api.createTimetableEntry(data)
      } catch (reason) {
        if (createdEnrollment) await api.deleteEnrollment(createdEnrollment.enrollment_id).catch(() => undefined)
        throw reason
      }
      await loadEnrollments()
      setTimetableCourseIds((current) => new Set(current).add(courseId))
      setSelectedCourse(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('common.errorFallback'))
    } finally {
      setChangingCourseId(null)
    }
  }

  async function dropTimetableCourse(courseId: number) {
    if (!window.confirm(t('academic.confirmDrop') || 'Remove this course from your timetable?')) return
    setChangingCourseId(courseId)
    setError('')
    try {
      await api.deleteTimetableCourse(courseId)
      setTimetableCourseIds((current) => {
        const next = new Set(current)
        next.delete(courseId)
        return next
      })
      await loadEnrollments()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('common.errorFallback'))
    } finally {
      setChangingCourseId(null)
    }
  }

  async function removeCourse(enrollment: Enrollment) {
    if (!window.confirm(t('courses.removeConfirm'))) return
    setChangingCourseId(Number(enrollment.course_id))
    setError('')
    try {
      await api.deleteEnrollment(Number(enrollment.enrollment_id))
      await loadEnrollments()
      setTimetableCourseIds((current) => {
        const next = new Set(current)
        next.delete(Number(enrollment.catalog_course_id || enrollment.course_id))
        return next
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('common.errorFallback'))
    } finally {
      setChangingCourseId(null)
    }
  }

  const tabs: { id: CoursesTab; labelKey: string }[] = [
    { id: 'current', labelKey: 'courses.tabCurrent' },
    { id: 'all', labelKey: 'courses.tabAll' },
    { id: 'offered', labelKey: 'courseCatalog.offeredThisTerm' },
    { id: 'past', labelKey: 'courses.tabPast' },
  ]
  const visibleEnrollments = tab === 'past' ? pastEnrollments : activeEnrollments

  return (
    <div className="min-h-full bg-[#F5F7FB]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#F5F7FB]/95 px-3 py-2 backdrop-blur-xl">
        <button type="button" onClick={() => navigate(-1)} className="rounded-lg p-1" aria-label={t('common.goBack')}><ArrowLeft className="h-4 w-4" /></button>
        <h1 className="text-[15px] font-bold text-pnu-text">{t('courses.title')}</h1>
        <Link to="/academic/recommended-courses" className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#E8F3FF] text-pnu-blue"><BookOpen className="h-4 w-4" /></Link>
      </header>

      <div className="space-y-3 px-3 pb-5">
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p> : null}
        <section>
          <h2 className="mb-1.5 text-[12px] font-bold text-pnu-text">{t('courses.overview')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              [t('courses.enrolledCourses'), activeEnrollments.length, t('courses.coursesUnit')],
              [t('courses.thisSemester'), semesterCredits, t('courses.creditsUnit')],
            ].map(([label, value, unit]) => (
              <div key={String(label)} className="rounded-[14px] bg-white px-3 py-2.5" style={{ boxShadow: CARD_SHADOW }}>
                <p className="text-[10px] font-medium text-pnu-muted">{label}</p>
                <p className="mt-1 text-[22px] font-bold leading-none text-pnu-text">{value}</p>
                <p className="mt-0.5 text-[10px] text-pnu-muted">{unit}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-3.5 overflow-x-auto border-b border-black/8">
          {tabs.map(({ id, labelKey }) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`-mb-px border-b-2 pb-1.5 text-[11px] font-semibold ${tab === id ? 'border-pnu-blue text-pnu-blue' : 'border-transparent text-pnu-muted'}`}>{t(labelKey)}</button>
          ))}
        </div>

        {(tab === 'all' || tab === 'offered') ? <CourseTermSelector value={term} onChange={setTerm} /> : null}

        {tab === 'all' || tab === 'offered' ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-pnu-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('courseCatalog.searchPlaceholder')} className="w-full rounded-xl border border-pnu-border bg-white py-2 pl-9 pr-3 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={catalogCategory}
                onChange={(event) => setCatalogCategory(event.target.value as CourseType | 'ALL')}
                className="rounded-xl border border-pnu-border bg-white px-3 py-2 text-xs text-pnu-text"
                aria-label={t('courseCatalog.categoryFilter')}
              >
                <option value="ALL">{t('courseFilter.all')}</option>
                <option value="REQUIRED">{t('courseFilter.required')}</option>
                <option value="ELECTIVE">{t('courseFilter.elective')}</option>
                <option value="GEN_ED">{t('courseFilter.genEd')}</option>
              </select>
              <select
                value={recommendedYear ?? ''}
                onChange={(event) => setRecommendedYear(event.target.value ? Number(event.target.value) : undefined)}
                className="rounded-xl border border-pnu-border bg-white px-3 py-2 text-xs text-pnu-text"
                aria-label={t('courseCatalog.yearFilter')}
              >
                <option value="">{t('courseCatalog.allYears')}</option>
                {[1, 2, 3, 4].map((year) => <option key={year} value={year}>{t('courseCatalog.yearOption', { year })}</option>)}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setMyMajorOnly((current) => !current)}
              className={`w-full rounded-xl px-3 py-2 text-xs font-bold ${myMajorOnly ? 'bg-pnu-blue text-white' : 'border border-pnu-border bg-white text-pnu-muted'}`}
            >
              {t(myMajorOnly ? 'courseCatalog.myMajorOnly' : 'courseCatalog.allMajors')}
            </button>
            <p className="text-[11px] font-semibold text-pnu-muted">{catalogTotal.toLocaleString()} {t('courses.coursesUnit')}</p>
            <section className="overflow-hidden rounded-[14px] bg-white" style={{ boxShadow: CARD_SHADOW }}>
              {catalogLoading && catalog.length === 0 ? <p className="p-8 text-center text-xs text-pnu-muted">{t('common.loading')}</p> : null}
              <ul className="divide-y divide-black/6">
                {catalog.map((course) => {
                  const courseId = Number(course.id)
                  const isAdded = currentCourseIds.has(courseId)
                  return (
                  <li key={course.id} className="flex items-center gap-2 pr-3">
                    <Link to={`/academic/recommended-courses/${course.id}?academicYear=${academicYear}&semester=${semester}`} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F3FF] text-pnu-blue"><BookOpen className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold text-pnu-blue">{course.officialCourseNumber || `${t('courses.courseId')} ${course.id}`}</span>
                        <span className="block truncate text-[13px] font-bold text-pnu-text">{course.nameEn || course.nameKo}</span>
                        <span className="block truncate text-[10px] text-pnu-muted">{[formatMajorName(course.majorName || course.department), `${course.credits} ${t('courses.creditsUnit')}`].filter(Boolean).join(' · ')}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-pnu-muted/40" />
                    </Link>
                    {isAdded ? (
                      <button
                        type="button"
                        onClick={() => dropTimetableCourse(courseId)}
                        disabled={changingCourseId === courseId}
                        className="group inline-flex shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title={t('academic.confirmDrop') || 'Remove from timetable'}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3] group-hover:hidden" />
                        <Trash2 className="hidden h-3.5 w-3.5 group-hover:inline" />
                        <span className="group-hover:hidden">{t('timetable.added')}</span>
                        <span className="hidden group-hover:inline">{t('common.remove') || 'Remove'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedCourse(course)}
                        disabled={changingCourseId === courseId}
                        className="shrink-0 rounded-xl bg-pnu-blue px-2.5 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-pnu-blue-light disabled:opacity-50"
                      >
                        {changingCourseId === courseId ? t('common.loading') : t('courses.addCurrent')}
                      </button>
                    )}
                  </li>
                  )
                })}
              </ul>
              {catalogHasMore ? <button type="button" onClick={loadMore} disabled={catalogLoading} className="w-full border-t border-pnu-border py-3 text-xs font-bold text-pnu-blue">{catalogLoading ? t('common.loading') : t('courseCatalog.loadMore')}</button> : null}
            </section>
          </>
        ) : (
          <>
            {tab === 'past' ? <button type="button" onClick={() => setShowAddPast(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-pnu-blue px-3 py-2.5 text-xs font-bold text-white"><Plus className="h-4 w-4" /> {t('courses.addPastCourse')}</button> : null}
            <section className="overflow-hidden rounded-[14px] bg-white" style={{ boxShadow: CARD_SHADOW }}>
              {loading ? <p className="p-8 text-center text-xs text-pnu-muted">{t('common.loading')}</p> : null}
              {!loading && visibleEnrollments.length === 0 ? <p className="p-8 text-center text-xs text-pnu-muted">{t('courses.emptyList')}</p> : null}
              <ul className="divide-y divide-black/6">
                {visibleEnrollments.map((enrollment) => {
                  const hasGrade = Boolean(enrollment.final_grade)
                  const credits = enrollment.credits_earned ?? enrollment.credit ?? 3
                  return (
                    <li key={enrollment.enrollment_id} className="flex items-center gap-1 pr-2">
                      <Link
                        to={`/academic/recommended-courses/${enrollment.catalog_course_id || enrollment.course_id}`}
                        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 transition active:bg-pnu-surface"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F3FF] text-pnu-blue">
                          <CalendarDays className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] font-bold text-pnu-blue">
                            {enrollment.official_course_number || `${t('courses.courseId')} ${enrollment.course_id}`}
                          </span>
                          <span className="block truncate text-[13px] font-bold text-pnu-text">
                            {enrollment.course_name_en || enrollment.course_name || t('courses.untitled')}
                          </span>
                          <span className="block truncate text-[10px] text-pnu-muted">
                            {enrollment.professor || t('courses.professorUnknown')} · {enrollment.semester}
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] text-pnu-muted">
                            {tab === 'past' ? (
                              hasGrade ? (
                                <span className="inline-flex items-center gap-1.5 font-medium">
                                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700">
                                    {enrollment.final_grade}
                                  </span>
                                  <span>· {credits} {t('courses.creditsUnit')}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                                  <span>{t('courses.gradePending') || 'Grade Pending'}</span>
                                  <span>· {credits} {t('courses.creditsUnit')}</span>
                                </span>
                              )
                            ) : (
                              formatSchedule(enrollment)
                            )}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-pnu-muted/40" />
                      </Link>

                      {tab === 'past' && !hasGrade ? (
                        <button
                          type="button"
                          onClick={() => setEditingPast(enrollment)}
                          className="shrink-0 rounded-xl bg-amber-500 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-amber-600"
                        >
                          {t('courses.inputGrade') || 'Enter Grade'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingPast(enrollment)}
                          className="shrink-0 rounded-lg p-2 text-pnu-muted transition hover:text-pnu-blue"
                          aria-label={t('courses.editPastCourse')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removeCourse(enrollment)}
                        disabled={changingCourseId === Number(enrollment.course_id)}
                        className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                        aria-label={t('courses.removeCourse')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          </>
        )}

        <Link to="/academic/recommended-courses" className="flex items-center gap-3 rounded-[14px] bg-white px-3 py-3" style={{ boxShadow: CARD_SHADOW }}><Sparkles className="h-5 w-5 text-[#7C3AED]" /><span className="flex-1 text-[13px] font-bold text-pnu-text">{t('courses.aiRecommendation')}</span><ChevronRight className="h-4 w-4 text-pnu-muted/40" /></Link>
      </div>

      {showAddPast ? <AddPastCourseModal existingEnrollments={enrollments} onClose={() => setShowAddPast(false)} onAdded={async () => { await loadEnrollments(); setShowAddPast(false) }} /> : null}
      {editingPast ? <EditPastCourseModal enrollment={editingPast} onClose={() => setEditingPast(null)} onSaved={async () => { await loadEnrollments(); setEditingPast(null) }} /> : null}
      {selectedCourse ? <AddTimetableModal course={selectedCourse} academicYear={academicYear} semester={semester} submitting={changingCourseId === Number(selectedCourse.id)} onClose={() => setSelectedCourse(null)} onSubmit={addCurrentCourse} /> : null}
    </div>
  )
}
