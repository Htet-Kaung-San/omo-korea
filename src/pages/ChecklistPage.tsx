import { useEffect, useState } from 'react'
import { api } from '@/api'
import type { ChecklistItem } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChecklistRow } from '@/components/checklist/ChecklistRow'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/context/AuthContext'

export function ChecklistPage() {
  const { user } = useAuth()
  const isFreshman = user?.studentId?.startsWith('2026') ?? false
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getChecklist()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load checklist.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(id: string, completed: boolean) {
    setUpdatingId(id)
    setError('')
    try {
      const updated = await api.updateChecklistItem(id, completed)
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item.')
    } finally {
      setUpdatingId(null)
    }
  }

  const completedCount = items.filter((i) => i.completed).length

  return (
    <div>
      <PageHeader
        title={isFreshman ? 'New Student Checklist' : 'Graduation Requirement Checklist'}
        subtitle={
          isFreshman
            ? 'Essential setup tasks for international students'
            : 'Key steps to complete your degree at PNU'
        }
      />

      <div className="space-y-4 px-5 py-5">
        {!loading && items.length > 0 ? (
          <div className="rounded-2xl border border-pnu-border bg-white p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-pnu-text">Progress</span>
              <span className="text-pnu-muted">
                {completedCount} of {items.length} completed
              </span>
            </div>
            <ProgressBar value={completedCount} max={items.length} />
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        {loading ? <p className="text-sm text-pnu-muted">Loading checklist…</p> : null}

        <div className="space-y-3">
          {items.map((item) => (
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
