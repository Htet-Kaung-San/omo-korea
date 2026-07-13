import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ToastTone = 'error' | 'success' | 'info'

export interface ToastMessage {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  toasts: ToastMessage[]
  showToast: (message: string, tone?: ToastTone) => void
  dismissToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0
type ToastListener = (message: string, tone: ToastTone) => void
const listeners = new Set<ToastListener>()

/** Used by the API client outside React components */
export function emitToast(message: string, tone: ToastTone = 'error'): void {
  listeners.forEach((listener) => listener(message, tone))
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'error') => {
      const trimmed = message.trim()
      if (!trimmed) return

      const id = ++toastId
      setToasts((current) => [...current, { id, message: trimmed, tone }])
      window.setTimeout(() => dismissToast(id), 4500)
    },
    [dismissToast],
  )

  useEffect(() => {
    const listener: ToastListener = (message, tone) => showToast(message, tone)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [showToast])

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
    }),
    [toasts, showToast, dismissToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm shadow-lg ${
              toast.tone === 'error'
                ? 'bg-red-600 text-white'
                : toast.tone === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <p className="flex-1">{toast.message}</p>
              <button
                type="button"
                className="text-white/80 hover:text-white"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
