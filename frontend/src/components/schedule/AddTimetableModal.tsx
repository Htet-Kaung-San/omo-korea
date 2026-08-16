import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type {
  CourseCatalogItem,
  CreateTimetableEntryInput,
  TimetableSlotInput,
} from '@/types/api'
import { useLanguage } from '@/context/LanguageContext'

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
] as const

interface Props {
  course: CourseCatalogItem
  academicYear: number
  semester: '1' | '2' | 'SUMMER' | 'WINTER'
  submitting: boolean
  onClose: () => void
  onSubmit: (data: CreateTimetableEntryInput) => Promise<void>
}

export function AddTimetableModal({
  course,
  academicYear,
  semester,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useLanguage()
  const [offeringId, setOfferingId] = useState<number | null>(
    course.offerings.length === 1 ? course.offerings[0].courseOfferingId : null,
  )
  const [manual, setManual] = useState(course.offerings.length === 0)
  const [slots, setSlots] = useState<TimetableSlotInput[]>([
    { day: 1, start: '09:00', end: '10:30', classroom: '' },
  ])

  const selectedOffering = useMemo(
    () => course.offerings.find((offering) => offering.courseOfferingId === offeringId) || null,
    [course.offerings, offeringId],
  )
  const offeringNeedsManualSlots = Boolean(selectedOffering && selectedOffering.slots.length === 0)
  const showManualSlots = manual || offeringNeedsManualSlots

  function updateSlot(index: number, patch: Partial<TimetableSlotInput>) {
    setSlots((current) => current.map((slot, slotIndex) =>
      slotIndex === index ? { ...slot, ...patch } : slot))
  }

  async function submit() {
    await onSubmit({
      courseId: Number(course.id),
      courseOfferingId: manual ? null : offeringId,
      academicYear,
      semester,
      slots: showManualSlots ? slots : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/35 sm:items-center sm:justify-center">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-[24px] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[24px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-pnu-blue">
              {course.officialCourseNumber || `${t('courses.courseId')} ${course.id}`}
            </p>
            <h2 className="mt-1 text-lg font-bold text-pnu-text">{course.nameEn}</h2>
            <p className="text-sm text-pnu-muted">{course.nameKo}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-black/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {course.offerings.length > 0 ? (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-bold text-pnu-text">{t('timetable.chooseOffering')}</p>
            {course.offerings.map((offering) => (
              <label key={offering.courseOfferingId} className="flex cursor-pointer gap-2 rounded-xl border border-pnu-border p-3">
                <input
                  type="radio"
                  name="offering"
                  checked={!manual && offeringId === offering.courseOfferingId}
                  onChange={() => {
                    setManual(false)
                    setOfferingId(offering.courseOfferingId)
                  }}
                />
                <span className="text-xs text-pnu-text">
                  <strong>{offering.section || t('timetable.sectionUnavailable')}</strong>
                  {offering.professor ? ` · ${offering.professor}` : ''}
                  <span className="mt-1 block text-pnu-muted">
                    {offering.schedule || t('timetable.scheduleUnavailable')}
                  </span>
                </span>
              </label>
            ))}
            <label className="flex cursor-pointer gap-2 rounded-xl border border-pnu-border p-3 text-xs">
              <input
                type="radio"
                name="offering"
                checked={manual}
                onChange={() => setManual(true)}
              />
              {t('timetable.manualSchedule')}
            </label>
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            {t('timetable.noOfferingHelp')}
          </p>
        )}

        {showManualSlots ? (
          <div className="mt-5 space-y-3">
            <p className="text-xs font-bold text-pnu-text">{t('timetable.meetingTimes')}</p>
            {slots.map((slot, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 rounded-xl bg-pnu-surface p-3">
                <select
                  value={slot.day}
                  onChange={(event) => updateSlot(index, { day: Number(event.target.value) })}
                  className="rounded-lg border border-pnu-border bg-white px-2 py-2 text-xs"
                >
                  {DAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                </select>
                <input
                  value={slot.classroom || ''}
                  onChange={(event) => updateSlot(index, { classroom: event.target.value })}
                  placeholder={t('timetable.classroomOptional')}
                  className="rounded-lg border border-pnu-border px-2 py-2 text-xs"
                />
                <input
                  type="time"
                  value={slot.start}
                  onChange={(event) => updateSlot(index, { start: event.target.value })}
                  className="rounded-lg border border-pnu-border px-2 py-2 text-xs"
                />
                <input
                  type="time"
                  value={slot.end}
                  onChange={(event) => updateSlot(index, { end: event.target.value })}
                  className="rounded-lg border border-pnu-border px-2 py-2 text-xs"
                />
                {slots.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setSlots((current) => current.filter((_, i) => i !== index))}
                    className="col-span-2 text-left text-xs font-semibold text-rose-600"
                  >
                    {t('timetable.removeMeeting')}
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSlots((current) => [
                ...current,
                { day: 3, start: '09:00', end: '10:30', classroom: '' },
              ])}
              className="text-xs font-bold text-pnu-blue"
            >
              + {t('timetable.addMeeting')}
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-pnu-border py-3 text-sm font-bold">
            {t('common.back')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || (!manual && !offeringId)}
            className="flex-1 rounded-xl bg-pnu-blue py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {submitting ? t('common.loading') : t('academic.addToTimetable')}
          </button>
        </div>
      </div>
    </div>
  )
}
