import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CalendarDays, CalendarPlus, ExternalLink } from 'lucide-react'
import { api } from '@/api'
import type { CourseCatalogItem, CreateTimetableEntryInput, Enrollment } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { CourseTermSelector } from '@/components/courses/CourseTermSelector'
import { AddTimetableModal } from '@/components/schedule/AddTimetableModal'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { enrollmentSemester, parseCourseTerm, type CourseTerm } from '@/utils/courseTerm'

const PNU_CATALOG_URL = 'https://onestop.pusan.ac.kr/page?menuCD=000000000000335'
const shown = (value: unknown) => value === null || value === undefined || value === '' ? '—' : String(value)

export function CourseDetailPage() {
  const { courseId } = useParams()
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const { showToast } = useToast()
  const [term, setTerm] = useState<CourseTerm>(() => parseCourseTerm(params.get('academicYear'), params.get('semester')))
  const [course, setCourse] = useState<CourseCatalogItem | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [inTimetable, setInTimetable] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setParams({ academicYear: String(term.academicYear), semester: term.semester }, { replace: true })
    setLoading(true)
    Promise.all([
      api.getCourseCatalog({ courseId, pageSize: 1, academicYear: term.academicYear, semester: term.semester }),
      api.getTimetable({ academicYear: term.academicYear, semester: term.semester }),
      user ? api.getEnrollments(user.studentId) : Promise.resolve([]),
    ]).then(([page, timetable, history]) => {
      setCourse(page.items[0] ?? null)
      setInTimetable(timetable.some((entry) => Number(entry.course_id) === Number(courseId)))
      setEnrollments(history)
      setError('')
    }).catch((reason) => setError(reason instanceof Error ? reason.message : t('academic.loadError')))
      .finally(() => setLoading(false))
  }, [courseId, language, setParams, t, term, user])

  async function addCourse(data: CreateTimetableEntryInput) {
    if (!user) return
    setSubmitting(true)
    let created: Enrollment | null = null
    try {
      const exists = enrollments.some((item) =>
        item.status !== 'Completed'
        && item.semester === enrollmentSemester(term)
        && Number(item.catalog_course_id || item.course_id) === data.courseId)
      if (!exists) created = await api.createEnrollment(user.studentId, data.courseId, enrollmentSemester(term))
      try { await api.createTimetableEntry(data) } catch (reason) {
        if (created) await api.deleteEnrollment(created.enrollment_id).catch(() => undefined)
        throw reason
      }
      setInTimetable(true)
      setShowAdd(false)
      showToast(t('timetable.added'), 'success')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('common.errorFallback'))
    } finally { setSubmitting(false) }
  }

  return <div>
    <PageHeader title={course?.nameEn || course?.nameKo || t('courses.title')} back />
    <div className="space-y-4 px-5 py-5">
      <CourseTermSelector value={term} onChange={setTerm} />
      {loading ? <p className="text-sm text-pnu-muted">{t('academic.loading')}</p> : null}
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
      {!loading && !course && !error ? <p className="text-sm text-pnu-muted">{t('academic.noCourses')}</p> : null}
      {course ? <>
        <article className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-pnu-blue">{course.officialCourseNumber || `${t('courses.courseId')} ${course.id}`}</p><h1 className="mt-1 text-lg font-bold">{course.nameEn || course.nameKo}</h1>{course.nameKo !== course.nameEn ? <p className="mt-1 text-sm text-pnu-muted">{course.nameKo}</p> : null}</div><CourseTypeBadge type={course.type} /></div>
          <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-pnu-muted">{t('courseTable.credits')}</dt><dd className="font-bold">{course.credits}</dd></div><div><dt className="text-xs text-pnu-muted">{t('courseTable.department')}</dt><dd className="font-bold">{shown(course.curriculum?.sourceDepartment || course.department || course.majorName)}</dd></div><div><dt className="text-xs text-pnu-muted">{t('courseCatalog.recommendedYear')}</dt><dd className="font-bold">{shown(course.recommendedYear)}</dd></div><div><dt className="text-xs text-pnu-muted">{t('courseCatalog.gradeSemester')}</dt><dd className="font-bold">{shown(course.curriculum?.gradeSemester)}</dd></div></dl>
          <button type="button" onClick={() => setShowAdd(true)} disabled={inTimetable} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pnu-blue py-3 text-sm font-bold text-white disabled:bg-emerald-50 disabled:text-emerald-700"><CalendarPlus className="h-4 w-4" />{inTimetable ? t('timetable.added') : t('courses.addCurrent')}</button>
        </article>

        {(course.descriptionEn || course.descriptionKo || course.prerequisites.length) ? <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">{course.descriptionEn || course.descriptionKo ? <><h2 className="font-bold">{t('courseCatalog.description')}</h2><p className="mt-2 text-sm text-pnu-muted">{language === 'ko' ? course.descriptionKo || course.descriptionEn : course.descriptionEn || course.descriptionKo}</p></> : null}{course.prerequisites.length ? <><h2 className="mt-4 font-bold">{t('courseCatalog.prerequisites')}</h2><ul className="mt-2 list-disc pl-5 text-sm text-pnu-muted">{course.prerequisites.map((item) => <li key={item.id}>{[item.officialCourseNumber, language === 'ko' ? item.nameKo : item.nameEn, item.requirementText].filter(Boolean).join(' · ')}</li>)}</ul></> : null}</section> : null}

        <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm"><div className="mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-pnu-blue" /><h2 className="font-bold">{t('courseCatalog.currentOfferings')}</h2></div>{course.offerings.length === 0 ? <p className="text-sm text-pnu-muted">{t('courseCatalog.noOfficialOffering')}</p> : <div className="space-y-3">{course.offerings.map((offering) => <div key={offering.courseOfferingId} className="rounded-xl bg-pnu-surface p-3 text-sm"><p className="font-bold">{[offering.officialCourseNumber, offering.section && `${t('courseCatalog.section')} ${offering.section}`].filter(Boolean).join(' · ')}</p><p className="mt-1 text-pnu-muted">{shown(offering.professor)} · {shown(offering.schedule)}</p>{offering.enrollmentLimit != null ? <p className="mt-1 text-pnu-muted">{t('courseCatalog.capacity')}: {offering.enrollmentLimit}</p> : null}{offering.teamTeachingStatus ? <p className="mt-1 text-pnu-muted">{t('courseCatalog.teamTeaching')}: {offering.teamTeachingStatus}</p> : null}{offering.generalEducationArea ? <p className="mt-1 text-pnu-muted">{t('courseCatalog.generalEducationArea')}: {offering.generalEducationArea}</p> : null}{offering.remarks ? <p className="mt-1 text-pnu-muted">{t('courseCatalog.remarks')}: {offering.remarks}</p> : null}{offering.restrictions.length ? <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"><p className="font-bold">{t('courseCatalog.restrictions')}</p>{offering.restrictions.map((item) => <p key={item.id} className="mt-1">{[item.permission, item.departmentCondition, item.yearLevelCondition, item.domesticForeignCondition, item.nationalityCondition, item.curriculumYearCondition, item.academicStatusCondition, item.degreeProgramCondition, item.reason, item.exceptionText].filter(Boolean).join(' · ')}</p>)}<p className="mt-2">{t('courseCatalog.eligibilityUnknown')}</p></div> : null}</div>)}</div>}</section>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><p>{t('courseCatalog.liveSeatsUnavailable')}</p><a href="https://e-onestop.pusan.ac.kr/login" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-bold underline"><ExternalLink className="h-3.5 w-3.5" />{t('courseCatalog.openRegistration')}</a></div>
        <a href={course.syllabusUrl || course.descriptionSourceUrl || PNU_CATALOG_URL} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-pnu-border bg-white py-3 text-sm font-bold text-pnu-blue"><ExternalLink className="h-4 w-4" />{t('courseCatalog.officialCatalog')}</a>
      </> : null}
    </div>
    {showAdd && course ? <AddTimetableModal course={course} academicYear={term.academicYear} semester={term.semester} submitting={submitting} onClose={() => setShowAdd(false)} onSubmit={addCourse} /> : null}
  </div>
}
