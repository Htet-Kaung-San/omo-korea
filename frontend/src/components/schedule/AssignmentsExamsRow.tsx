import { ChevronRight, ClipboardList } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

/** Assignments block for the daily schedule card; empty until assignment APIs exist. */
export function AssignmentsExamsRow({ embedded = false }: { embedded?: boolean }) {
  const { t } = useLanguage()

  const body = (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ClipboardList className="h-4 w-4 text-pnu-muted" strokeWidth={1.9} />
          <h3 className="text-[13px] font-bold text-pnu-text">
            {t('schedule.assignments')}
          </h3>
        </div>
        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-pnu-blue">
          {t('common.viewAll')}
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
      </div>
      <div className="flex flex-col items-center gap-1.5 py-4 text-center">
        <ClipboardList className="h-5 w-5 text-pnu-muted/45" />
        <p className="text-[11px] font-medium text-pnu-muted">
          {t('schedule.assignmentsEmpty')}
        </p>
      </div>
    </>
  )

  if (embedded) {
    return <div className="border-t border-black/6 pt-3">{body}</div>
  }

  return (
    <section className="rounded-[16px] bg-white p-3.5 shadow-sm ring-1 ring-black/5">
      {body}
    </section>
  )
}
