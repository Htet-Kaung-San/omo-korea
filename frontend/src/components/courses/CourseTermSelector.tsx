import type { CourseSemester, CourseTerm } from '@/utils/courseTerm'
import { useLanguage } from '@/context/LanguageContext'

interface CourseTermSelectorProps {
  value: CourseTerm
  onChange: (term: CourseTerm) => void
}

export function CourseTermSelector({ value, onChange }: CourseTermSelectorProps) {
  const { t } = useLanguage()
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, index) => currentYear + 1 - index)

  return (
    <div className="grid grid-cols-2 gap-2" aria-label={t('courseCatalog.termSelector')}>
      <select
        value={value.academicYear}
        onChange={(event) => onChange({ ...value, academicYear: Number(event.target.value) })}
        className="rounded-xl border border-pnu-border bg-white px-3 py-2 text-xs text-pnu-text"
        aria-label={t('courseCatalog.academicYear')}
      >
        {years.map((year) => <option key={year} value={year}>{year}</option>)}
      </select>
      <select
        value={value.semester}
        onChange={(event) => onChange({ ...value, semester: event.target.value as CourseSemester })}
        className="rounded-xl border border-pnu-border bg-white px-3 py-2 text-xs text-pnu-text"
        aria-label={t('courseCatalog.semester')}
      >
        <option value="1">{t('courseCatalog.spring')}</option>
        <option value="2">{t('courseCatalog.fall')}</option>
        <option value="SUMMER">{t('courseCatalog.summer')}</option>
        <option value="WINTER">{t('courseCatalog.winter')}</option>
      </select>
    </div>
  )
}
