import { useMemo, useState } from 'react'
import {
  Filter,
  MessageSquarePlus,
  Pin,
  Search,
  X,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import sanjini from '@/assets/pnu-character.png'
import type { ChatCategory, ChatThread } from '@/utils/chatHistory'

interface ChatHistoryDrawerProps {
  open: boolean
  threads: ChatThread[]
  activeId: string | null
  onClose: () => void
  onSelect: (thread: ChatThread) => void
  onNewChat: () => void
  onTogglePin: (id: string) => void
}

const FILTERS: { id: ChatCategory; labelKey: string }[] = [
  { id: 'all', labelKey: 'chat.historyFilterAll' },
  { id: 'pinned', labelKey: 'chat.historyFilterPinned' },
  { id: 'courses', labelKey: 'chat.historyFilterCourses' },
  { id: 'visa', labelKey: 'chat.historyFilterVisa' },
  { id: 'campus', labelKey: 'chat.historyFilterCampus' },
]

function formatRelative(ts: number, locale: string) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(ts).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

export function ChatHistoryDrawer({
  open,
  threads,
  activeId,
  onClose,
  onSelect,
  onNewChat,
  onTogglePin,
}: ChatHistoryDrawerProps) {
  const { locale, t } = useLanguage()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ChatCategory>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return threads.filter((thread) => {
      if (filter === 'pinned' && !thread.pinned) return false
      if (filter !== 'all' && filter !== 'pinned' && thread.category !== filter) return false
      if (!q) return true
      return (
        thread.title.toLowerCase().includes(q) ||
        thread.preview.toLowerCase().includes(q)
      )
    })
  }, [threads, query, filter])

  return (
    <>
      <button
        type="button"
        aria-label={t('common.goBack')}
        className={[
          'absolute inset-0 z-40 bg-black/30 transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={onClose}
      />

      <aside
        className={[
          'absolute inset-y-0 left-0 z-50 flex w-[86%] max-w-[340px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between gap-2 border-b border-black/5 px-4 py-3">
          <h2 className="text-[20px] font-bold tracking-tight text-pnu-text">
            {t('chat.historyTitle')}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onNewChat()
                onClose()
              }}
              className="rounded-full p-2 text-pnu-blue transition hover:bg-pnu-blue/10"
              aria-label={t('chat.newChat')}
              title={t('chat.newChat')}
            >
              <MessageSquarePlus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-pnu-muted transition hover:bg-black/5"
              aria-label={t('common.goBack')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-black/5 px-3 py-2.5">
          <div className="flex items-center gap-2 rounded-full bg-[#F2F2F7] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-pnu-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('chat.historySearch')}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-pnu-text outline-none placeholder:text-pnu-muted"
            />
            <Filter className="h-4 w-4 shrink-0 text-pnu-muted" />
          </div>

          <div className="mt-2.5 flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map(({ id, labelKey }) => {
              const active = filter === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={[
                    'shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition',
                    active
                      ? 'bg-pnu-blue text-white'
                      : 'bg-[#F2F2F7] text-pnu-muted',
                  ].join(' ')}
                >
                  {t(labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[13px] font-medium text-pnu-muted">
                {t('chat.historyEmpty')}
              </p>
              <button
                type="button"
                onClick={() => {
                  onNewChat()
                  onClose()
                }}
                className="mt-3 text-[13px] font-semibold text-pnu-blue"
              >
                {t('chat.newChat')}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-black/5">
              {filtered.map((thread) => {
                const selected = thread.id === activeId
                return (
                  <li key={thread.id}>
                    <div
                      className={[
                        'flex w-full items-start gap-2.5 px-3 py-3 transition',
                        selected ? 'bg-pnu-blue/8' : 'hover:bg-[#F8FAFC]',
                      ].join(' ')}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(thread)
                          onClose()
                        }}
                        className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                      >
                        <img
                          src={sanjini}
                          alt=""
                          className="mt-0.5 h-10 w-10 shrink-0 rounded-full bg-[#E8F3FF] object-contain ring-1 ring-black/5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-[13px] font-bold text-pnu-text">
                              {thread.title}
                            </p>
                            <span className="shrink-0 text-[10px] font-medium text-pnu-muted">
                              {formatRelative(thread.updatedAt, locale)}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-pnu-muted">
                            {thread.preview}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onTogglePin(thread.id)}
                        className={[
                          'mt-1 shrink-0 rounded-full p-1.5 transition',
                          thread.pinned
                            ? 'text-pnu-blue'
                            : 'text-pnu-muted/50 hover:text-pnu-blue',
                        ].join(' ')}
                        aria-label={t('chat.pinChat')}
                      >
                        <Pin
                          className="h-3.5 w-3.5"
                          fill={thread.pinned ? 'currentColor' : 'none'}
                        />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-black/5 p-3">
          <div className="rounded-[16px] bg-gradient-to-br from-[#E8F3FF] to-[#F0F7FF] p-3.5 ring-1 ring-pnu-blue/10">
            <p className="text-[13px] font-bold text-pnu-text">
              {t('chat.historyPromoTitle')}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-pnu-muted">
              {t('chat.historyPromoBody')}
            </p>
            <button
              type="button"
              onClick={() => {
                onNewChat()
                onClose()
              }}
              className="mt-2.5 rounded-full bg-pnu-blue px-3.5 py-1.5 text-[11px] font-semibold text-white"
            >
              {t('chat.historyPromoCta')}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
