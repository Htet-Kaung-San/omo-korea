import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Download } from 'lucide-react'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'
import type { AcademicRecords } from '@/types/api'

export function AcademicRecordsPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [records, setRecords] = useState<AcademicRecords | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    api
      .getAcademicRecords()
      .then(setRecords)
      .catch((err) =>
        setError(err instanceof Error ? err.message : t('academicRecords.loadError')),
      )
      .finally(() => setLoading(false))
  }, [t])

  async function handleDownload() {
    setDownloading(true)
    try {
      const blob = await api.downloadTranscript()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transcript-${records?.studentId || 'student'}.txt`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : t('academicRecords.downloadError'))
    } finally {
      setDownloading(false)
    }
  }

  const progress =
    records && records.requiredCredits > 0
      ? Math.min(100, Math.round((records.completedCredits / records.requiredCredits) * 100))
      : 0

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-pnu-text shadow-sm ring-1 ring-black/5"
          aria-label={t('common.back')}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[18px] font-bold text-pnu-text">{t('academicRecords.title')}</h1>
      </div>

      <div className="space-y-4 px-4 pt-2">
        {loading ? <p className="text-sm text-pnu-muted">{t('common.loading')}</p> : null}
        {error ? (
          <div className="rounded-[18px] bg-white p-4 text-sm text-pnu-muted shadow-sm ring-1 ring-black/5">
            {error}
          </div>
        ) : null}

        {records ? (
          <>
            <div className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-pnu-muted">
                    {t('academicRecords.overallGpa')}
                  </p>
                  <p className="mt-1 text-[28px] font-bold tracking-tight text-pnu-blue">
                    {records.overallGpa.toFixed(2)}
                    <span className="text-[16px] font-semibold text-pnu-muted">
                      {' '}
                      / {records.gpaScale.toFixed(1)}
                    </span>
                  </p>
                </div>
                <span className="rounded-full bg-pnu-blue/10 px-3 py-1 text-[12px] font-bold text-pnu-blue">
                  {records.standing}
                </span>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-pnu-text">
                    {t('academicRecords.completedCredits')}
                  </span>
                  <span className="font-semibold text-pnu-muted">
                    {records.completedCredits} / {records.requiredCredits}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-pnu-surface">
                  <div
                    className="h-full rounded-full bg-pnu-blue transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-2 px-1 text-[15px] font-bold text-pnu-text">
                {t('academicRecords.semesterPerformance')}
              </h2>
              <div className="overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-black/5">
                <div className="divide-y divide-pnu-border">
                  {records.semesters.map((semester) => (
                    <div
                      key={semester.semesterLabel}
                      className="flex items-center justify-between px-4 py-3.5"
                    >
                      <span className="text-[14px] font-medium text-pnu-text">
                        {semester.semesterLabel}
                      </span>
                      <span className="text-[14px] font-semibold text-pnu-text">
                        {semester.gpa.toFixed(2)} / {records.gpaScale.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-pnu-blue px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {downloading ? t('academicRecords.downloading') : t('academicRecords.download')}
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
