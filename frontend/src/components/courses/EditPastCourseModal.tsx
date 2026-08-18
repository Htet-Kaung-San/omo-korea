import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'
import type { Enrollment } from '@/types/api'

const GRADES = ['A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'D0', 'F', 'P', 'NP', 'S', 'U']

export function EditPastCourseModal({ enrollment, onClose, onSaved }: {
  enrollment: Enrollment
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const { t } = useLanguage()
  const [semester, setSemester] = useState(enrollment.semester)
  const [finalGrade, setFinalGrade] = useState(enrollment.final_grade || '')
  const [creditsEarned, setCreditsEarned] = useState(enrollment.credits_earned == null ? '' : String(enrollment.credits_earned))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')
    try {
      await api.updateEnrollment(enrollment.enrollment_id, {
        semester,
        finalGrade: finalGrade || null,
        creditsEarned: creditsEarned === '' ? null : Number(creditsEarned),
      })
      await onSaved()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('common.errorFallback'))
    } finally {
      setSaving(false)
    }
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 sm:items-center">
    <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="font-bold text-pnu-text">{t('courses.editPastCourse')}</h2><p className="text-xs text-pnu-muted">{enrollment.course_name_en || enrollment.course_name}</p></div>
        <button type="button" onClick={onClose} className="rounded-full p-2"><X className="h-5 w-5" /></button>
      </div>
      <div className="mt-4 space-y-3">
        <input value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="2025-Fall" className="w-full rounded-xl border border-pnu-border px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <select value={finalGrade} onChange={(event) => setFinalGrade(event.target.value)} className="rounded-xl border border-pnu-border px-3 py-2 text-sm"><option value="">{t('courses.gradeUnknown')}</option>{GRADES.map((grade) => <option key={grade}>{grade}</option>)}</select>
          <input type="number" min="0" step="0.5" value={creditsEarned} onChange={(event) => setCreditsEarned(event.target.value)} placeholder={t('courses.creditsEarned')} className="rounded-xl border border-pnu-border px-3 py-2 text-sm" />
        </div>
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p> : null}
        <button type="button" onClick={save} disabled={saving} className="w-full rounded-xl bg-pnu-blue py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? t('common.loading') : t('common.save')}</button>
      </div>
    </div>
  </div>
}
