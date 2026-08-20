/*
 * Service worker for push notifications.
 *
 * Deliberately minimal: it handles push delivery and nothing else. It does not
 * cache or serve assets, because an offline cache that serves a stale build is
 * a much worse failure than having no cache at all — this app's whole subject
 * is information that changes.
 *
 * Served from /sw.js so its scope covers the whole origin.
 */

self.addEventListener('install', () => {
  // Take over immediately rather than waiting for every tab to close, so a
  // student who just granted permission is subscribed on this visit.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  // A push with no readable payload still has to show something: browsers
  // require a visible notification for every push, and staying silent can cost
  // the site its permission.
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {}
  }

  const title = payload.title || 'Hey! PNU'
  const options = {
    body: payload.body || '',
    icon: '/app-icon.png',
    badge: '/app-icon.png',
    lang: payload.lang || 'en',
    tag: payload.tag || 'heypnu-notice',
    // Replace rather than stack: several notices arriving together should not
    // bury the phone in separate alerts.
    renotify: Boolean(payload.tag),
    data: { url: payload.url || '/notifications' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/notifications'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus a tab that is already open rather than opening a duplicate.
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
