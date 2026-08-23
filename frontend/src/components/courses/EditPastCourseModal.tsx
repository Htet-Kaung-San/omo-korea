import { useState } from 'react'
import { Award, Check, X } from 'lucide-react'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'
import type { Enrollment } from '@/types/api'

const QUICK_GRADES = ['A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'P', 'F']
const OTHER_GRADES = ['A-', 'B-', 'C-', 'D0', 'D-', 'NP', 'S', 'U']

export function EditPastCourseModal({
  enrollment,
  onClose,
  onSaved,
}: {
  enrollment: Enrollment
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const { t } = useLanguage()
  const [semester, setSemester] = useState(enrollment.semester)
  const [finalGrade, setFinalGrade] = useState(enrollment.final_grade || '')
  const courseCredits = enrollment.credit || enrollment.credits_earned || 3
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!finalGrade) {
      setError(t('courses.selectGradeWarning') || 'Please select a final grade')
      return
    }
    setSaving(true)
    setError('')
    try {
      const isFailing = finalGrade === 'F' || finalGrade === 'NP' || finalGrade === 'U'
      const creditsToEarn = isFailing ? 0 : courseCredits

      await api.updateEnrollment(enrollment.enrollment_id, {
        semester,
        finalGrade,
        creditsEarned: creditsToEarn,
      })
      await onSaved()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('common.errorFallback'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-[24px] bg-white p-5 shadow-2xl sm:rounded-[24px]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-black/6 pb-3">
          <div>
            <span className="text-[10px] font-bold text-pnu-blue">
              {enrollment.official_course_number || enrollment.course_name || ''}
            </span>
            <h2 className="text-[16px] font-bold text-pnu-text">
              {enrollment.course_name_en || enrollment.course_name || t('courses.untitled')}
            </h2>
            <p className="text-[11px] text-pnu-muted">
              {enrollment.professor || t('courses.professorUnknown')} · {semester}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-pnu-muted hover:bg-black/5"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {/* Automatic Credit & Semester Info */}
          <div className="flex items-center justify-between rounded-xl bg-pnu-surface px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-pnu-blue" />
              <span className="text-xs font-semibold text-pnu-text">
                {t('courseTable.credits')}
              </span>
            </div>
            <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-bold text-pnu-blue">
              {courseCredits} {t('courses.creditsUnit')} ({t('courses.autoIncluded') || 'Auto-included'})
            </span>
          </div>

          {/* Quick Grade Selector */}
          <div>
            <label className="mb-2 block text-xs font-bold text-pnu-text">
              {t('courses.selectGrade') || 'Select Final Grade'}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_GRADES.map((grade) => {
                const isSelected = finalGrade === grade
                const isPassing = !['F', 'NP', 'U'].includes(grade)
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => {
                      setFinalGrade(grade)
                      setError('')
                    }}
                    className={`flex h-10 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-pnu-blue text-white shadow-sm ring-2 ring-pnu-blue ring-offset-1'
                        : isPassing
                          ? 'border border-pnu-border bg-white text-pnu-text hover:border-pnu-blue/50'
                          : 'border border-red-200 bg-red-50 text-red-600 hover:border-red-300'
                    }`}
                  >
                    {isSelected && <Check className="mr-1 h-3 w-3 stroke-[3]" />}
                    {grade}
                  </button>
                )
              })}
            </div>

            {/* Other Grades Dropdown */}
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="text-[11px] text-pnu-muted">
                {t('courses.otherGrades') || 'Other letter grades'}:
              </span>
              <select
                value={OTHER_GRADES.includes(finalGrade) ? finalGrade : ''}
                onChange={(event) => {
                  if (event.target.value) {
                    setFinalGrade(event.target.value)
                    setError('')
                  }
                }}
                className="rounded-lg border border-pnu-border bg-white px-2.5 py-1 text-xs text-pnu-text"
              >
                <option value="">{t('courses.chooseOther') || 'Choose...'}</option>
                {OTHER_GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Semester Selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-pnu-muted">
              {t('courses.semesterTaken') || 'Semester Taken'}
            </label>
            <input
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              placeholder="2026-Spring"
              className="w-full rounded-xl border border-pnu-border px-3 py-2 text-xs font-medium text-pnu-text"
            />
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          ) : null}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-pnu-border bg-white py-2.5 text-xs font-bold text-pnu-muted"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !finalGrade}
              className="flex-2 rounded-xl bg-pnu-blue px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-opacity disabled:opacity-40"
            >
              {saving ? t('common.loading') : t('courses.recordGrade') || 'Save Grade & Credits'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
