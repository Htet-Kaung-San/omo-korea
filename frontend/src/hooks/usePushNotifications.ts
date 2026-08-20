import { useCallback, useEffect, useState } from 'react'
import { api } from '@/api'

/**
 * Browser push notifications.
 *
 * Three things have to line up before a student can be subscribed: the browser
 * must support the Push API, the server must hold a VAPID key pair, and the
 * student must grant permission. They are reported separately because the
 * remedy differs — an unsupported browser is not the student's problem to fix,
 * a blocked permission cannot be re-requested from JavaScript at all, and an
 * unconfigured server is ours.
 *
 * iOS is the case worth knowing about: Safari delivers push only to a site the
 * student has added to their home screen. On iPhone in a normal tab
 * `PushManager` is absent, so this reports unsupported — which is accurate,
 * and the UI says why.
 */
export type PushState =
  | 'unsupported'      // the browser has no Push API (includes iOS Safari in a tab)
  | 'unconfigured'     // the server has no VAPID keys
  | 'denied'           // the student blocked notifications; only they can undo it
  | 'subscribed'
  | 'unsubscribed'
  | 'loading'

const urlBase64ToUint8Array = (base64: string) => {
  // VAPID keys are base64url; atob needs standard base64 with padding.
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

const browserSupportsPush = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('loading')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!browserSupportsPush()) {
      setState('unsupported')
      return
    }
    try {
      const config = await api.getPushConfig()
      if (!config.enabled || !config.publicKey) {
        setState('unconfigured')
        return
      }
      if (Notification.permission === 'denied') {
        setState('denied')
        return
      }
      const registration = await navigator.serviceWorker.getRegistration()
      const existing = await registration?.pushManager.getSubscription()
      setState(existing ? 'subscribed' : 'unsubscribed')
    } catch {
      // Not being able to ask the server is not the same as being unsupported.
      setState('unconfigured')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const subscribe = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const config = await api.getPushConfig()
      if (!config.enabled || !config.publicKey) throw new Error('Push is not configured on the server')

      // Asking must be driven by a click. Browsers ignore — and some
      // permanently penalise — a permission prompt raised on page load.
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'unsubscribed')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        // Chrome refuses a subscription that could deliver silently.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      })

      const json = subscription.toJSON() as {
        endpoint?: string
        keys?: { p256dh?: string; auth?: string }
      }
      await api.subscribeToPush({
        endpoint: json.endpoint ?? '',
        keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
      })
      setState('subscribed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable notifications')
      await refresh()
    } finally {
      setBusy(false)
    }
  }, [refresh])

  const unsubscribe = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        // Tell the server first: if the browser unsubscribes and the request
        // then fails, the server keeps sending to an endpoint nothing listens
        // on until the push service reports it gone.
        await api.unsubscribeFromPush(subscription.endpoint)
        await subscription.unsubscribe()
      }
      setState('unsubscribed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disable notifications')
    } finally {
      setBusy(false)
    }
  }, [])

  const sendTest = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      await api.sendTestPush()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a test notification')
    } finally {
      setBusy(false)
    }
  }, [])

  return { state, error, busy, subscribe, unsubscribe, sendTest, refresh }
}
