import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'
import type { Notification } from '@/types/api'

export const NOTICE_REFRESH_INTERVAL_MS = 60_000

type NoticeRefreshContextValue = {
  notifications: Notification[]
  loading: boolean
  error: string
}

const NoticeRefreshContext = createContext<NoticeRefreshContextValue | null>(null)

export function NoticeRefreshProvider({ children }: { children: ReactNode }) {
  const { language, t } = useLanguage()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let requestInFlight = false

    async function refresh({ initial = false } = {}) {
      if (requestInFlight) return
      requestInFlight = true
      if (initial) setLoading(true)

      try {
        const items = await api.getPersonalizedNotifications()
        if (!active) return
        setNotifications(items)
        setError('')
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : t('notifications.loadError'))
      } finally {
        requestInFlight = false
        if (active && initial) setLoading(false)
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }

    void refresh({ initial: true })
    const timer = window.setInterval(refreshWhenVisible, NOTICE_REFRESH_INTERVAL_MS)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [language, t])

  const value = useMemo(
    () => ({ notifications, loading, error }),
    [notifications, loading, error],
  )

  return (
    <NoticeRefreshContext.Provider value={value}>
      {children}
    </NoticeRefreshContext.Provider>
  )
}

export function useNoticeRefresh(): NoticeRefreshContextValue {
  const value = useContext(NoticeRefreshContext)
  if (!value) {
    throw new Error('useNoticeRefresh must be used within NoticeRefreshProvider')
  }
  return value
}
