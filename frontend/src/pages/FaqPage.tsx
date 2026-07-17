import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { api } from '@/api'
import type { FaqItem } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

export function FaqPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<FaqItem[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .getFaqItems()
      .then((data) => {
        if (cancelled) return
        setItems(data)
        setOpenId(data[0]?.id ?? null)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load FAQ')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <PageHeader title={t('support.more.faq')} subtitle={t('support.more.faqDesc')} back />
      <div className="space-y-2 px-4 py-4">
        {loading ? (
          <p className="rounded-[18px] bg-white px-4 py-6 text-center text-sm text-pnu-muted shadow-sm ring-1 ring-black/5">
            Loading…
          </p>
        ) : null}
        {error ? (
          <p className="rounded-[18px] bg-white px-4 py-6 text-center text-sm text-rose-600 shadow-sm ring-1 ring-black/5">
            {error}
          </p>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <p className="rounded-[18px] bg-white px-4 py-6 text-center text-sm text-pnu-muted shadow-sm ring-1 ring-black/5">
            No FAQ items available yet.
          </p>
        ) : null}
        {items.map((item) => {
          const open = openId === item.id
          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-black/5"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
              >
                <span className="min-w-0 flex-1 text-[14px] font-semibold text-pnu-text">
                  {item.question}
                </span>
                <ChevronDown
                  className={`mt-0.5 h-4 w-4 shrink-0 text-pnu-muted transition ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open ? (
                <p className="border-t border-pnu-border px-4 py-3 text-[13px] leading-relaxed text-pnu-muted">
                  {item.answer}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
