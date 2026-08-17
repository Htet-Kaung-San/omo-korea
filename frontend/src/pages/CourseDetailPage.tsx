import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BookOpen, CalendarDays, GraduationCap, MapPin, UserRound } from 'lucide-react'
import { api } from '@/api'
import type { CourseCatalogItem } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { useLanguage } from '@/context/LanguageContext'

function valueOrDash(value: unknown) {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

export function CourseDetailPage() {
  const { courseId } = useParams()
  const { language, t } = useLanguage()
  const [course, setCourse] = useState<CourseCatalogItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const now = new Date()
    const academicYear = now.getFullYear()
    const semester = now.getMonth() + 1 >= 7 ? '2' : '1'
    setLoading(true)
    setError('')
    api
      .getCourseCatalog({ courseId, pageSize: 1, academicYear, semester })
      .then((page) => setCourse(page.items[0] ?? null))
      .catch((reason) => setError(reason instanceof Error ? reason.message : t('academic.loadError')))
      .finally(() => setLoading(false))
  }, [language, courseId, t])

  return (
    <div>
      <PageHeader title={course?.nameEn || course?.nameKo || t('courses.title')} back />
      <div className="space-y-4 px-5 py-5">
        {loading ? <p className="text-sm text-pnu-muted">{t('academic.loading')}</p> : null}
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
        {!loading && !course && !error ? <p className="text-sm text-pnu-muted">{t('academic.noCourses')}</p> : null}

        {course ? (
          <>
            <article className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-pnu-blue">
                    {course.officialCourseNumber || `${t('courses.courseId')} ${course.id}`}
                  </p>
                  <h1 className="mt-1 text-lg font-bold text-pnu-text">{course.nameEn || course.nameKo}</h1>
                  {course.nameKo && course.nameKo !== course.nameEn ? <p className="mt-1 text-sm text-pnu-muted">{course.nameKo}</p> : null}
                </div>
                <CourseTypeBadge type={course.type} />
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs font-semibold text-pnu-muted">{t('courseTable.credits')}</dt><dd className="font-bold text-pnu-text">{course.credits}</dd></div>
                <div><dt className="text-xs font-semibold text-pnu-muted">{t('courseTable.department')}</dt><dd className="font-bold text-pnu-text">{valueOrDash(course.curriculum?.sourceDepartment || course.department || course.majorName)}</dd></div>
                <div><dt className="text-xs font-semibold text-pnu-muted">{t('courseCatalog.recommendedYear')}</dt><dd className="font-bold text-pnu-text">{valueOrDash(course.recommendedYear)}</dd></div>
                <div><dt className="text-xs font-semibold text-pnu-muted">{t('courseCatalog.curriculumYears')}</dt><dd className="font-bold text-pnu-text">{course.curriculumYears.length ? course.curriculumYears.join(', ') : '—'}</dd></div>
                <div><dt className="text-xs font-semibold text-pnu-muted">{t('courseCatalog.gradeSemester')}</dt><dd className="font-bold text-pnu-text">{valueOrDash(course.curriculum?.gradeSemester)}</dd></div>
                <div><dt className="text-xs font-semibold text-pnu-muted">{t('courseCatalog.college')}</dt><dd className="font-bold text-pnu-text">{valueOrDash(course.collegeId)}</dd></div>
              </dl>
            </article>

            <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-pnu-blue" /><h2 className="font-bold text-pnu-text">{t('courseCatalog.currentOfferings')}</h2></div>
              {course.offerings.length === 0 ? <p className="text-sm text-pnu-muted">{t('courseCatalog.noOfficialOffering')}</p> : (
                <div className="space-y-3">
                  {course.offerings.map((offering) => (
                    <div key={offering.courseOfferingId} className="rounded-xl bg-pnu-surface p-3 text-sm">
                      <p className="font-bold text-pnu-text">{[offering.officialCourseNumber, offering.section && `${t('courseCatalog.section')} ${offering.section}`].filter(Boolean).join(' · ')}</p>
                      <p className="mt-1 flex items-center gap-1 text-pnu-muted"><UserRound className="h-3.5 w-3.5" />{valueOrDash(offering.professor)}</p>
                      <p className="mt-1 flex items-start gap-1 text-pnu-muted"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{valueOrDash(offering.schedule)}</p>
                      <p className="mt-1 flex items-center gap-1 text-pnu-muted"><GraduationCap className="h-3.5 w-3.5" />{offering.academicYear} · {offering.semester}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {(course.examInformation || course.presentationRequirement || course.groupProjectRequirement || course.assignmentRequirement) ? (
              <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-pnu-blue" /><h2 className="font-bold text-pnu-text">{t('courseCatalog.classDetails')}</h2></div>
                <dl className="space-y-2 text-sm text-pnu-muted">
                  <div><dt className="font-semibold text-pnu-text">{t('courseCatalog.exam')}</dt><dd>{valueOrDash(course.examInformation)}</dd></div>
                  <div><dt className="font-semibold text-pnu-text">{t('courseCatalog.presentation')}</dt><dd>{valueOrDash(course.presentationRequirement)}</dd></div>
                  <div><dt className="font-semibold text-pnu-text">{t('courseCatalog.groupProject')}</dt><dd>{valueOrDash(course.groupProjectRequirement)}</dd></div>
                  <div><dt className="font-semibold text-pnu-text">{t('courseCatalog.assignment')}</dt><dd>{valueOrDash(course.assignmentRequirement)}</dd></div>
                </dl>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
