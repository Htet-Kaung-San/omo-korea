import { useEffect, useState } from 'react'
import { api } from '@/api'
import type { ChecklistItem } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChecklistRow } from '@/components/checklist/ChecklistRow'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useLanguage } from '@/context/LanguageContext'

/** Full list of the signed-in student's `checklist_item` rows. */
export function ChecklistPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .getChecklist()
      .then((payload) => setItems(payload.items))
      .catch((err) =>
        setError(err instanceof Error ? err.message : t('checklist.loadError')),
      )
      .finally(() => setLoading(false))
  }, [t])

  async function handleToggle(id: string, completed: boolean) {
    setUpdatingId(id)
    setError('')
    try {
      const updated = await api.updateChecklistItem(id, completed)
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checklist.updateError'))
    } finally {
      setUpdatingId(null)
    }
  }

  const pendingItems = items.filter((i) => !i.completed)
  const completedCount = items.filter((i) => i.completed).length

  return (
    <div>
      <PageHeader
        back
        title={t('checklist.title')}
        subtitle={t('checklist.subtitle')}
      />

      <div className="space-y-4 px-5 py-5">
        {!loading && items.length > 0 && pendingItems.length > 0 ? (
          <div className="rounded-2xl border border-pnu-border bg-white p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-pnu-text">
                {t('home.checklistProgress')}
              </span>
              <span className="text-pnu-muted">
                {t('common.completedCount', {
                  completed: completedCount,
                  total: items.length,
                })}
              </span>
            </div>
            <ProgressBar value={completedCount} max={items.length} />
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-pnu-muted">{t('checklist.loading')}</p>
        ) : null}

        {!loading && pendingItems.length === 0 ? (
          <p className="text-sm text-pnu-muted">
            {items.length > 0 ? t('checklist.allDone') : t('home.noChecklist')}
          </p>
        ) : null}

        <div className="space-y-3">
          {pendingItems.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              disabled={updatingId === item.id}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
