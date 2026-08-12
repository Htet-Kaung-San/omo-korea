import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => readFileSync(join(frontendRoot, relativePath), 'utf8')

const context = read('src/context/NoticeRefreshContext.tsx')
assert.match(context, /NOTICE_REFRESH_INTERVAL_MS\s*=\s*60_000/)
assert.match(context, /document\.visibilityState\s*===\s*'visible'/)
assert.match(context, /visibilitychange/)
assert.match(context, /requestInFlight/)
assert.match(context, /api\.getPersonalizedNotifications\(\)/)

const app = read('src/App.tsx')
assert.match(app, /<NoticeRefreshProvider>/)

const apiIndex = read('src/api/index.ts')
assert.match(apiIndex, /VITE_API_MODE\s*\?\?\s*'real'/)
assert.match(apiIndex, /!import\.meta\.env\.PROD\s*&&\s*configuredMode\s*===\s*'mock'/)
assert.match(apiIndex, /isMockApi\s*\?\s*mockApi\s*:\s*realApi/)
assert.match(read('src/pages/LoginPage.tsx'), /\{isMockApi\s*\?\s*\(/)
assert.match(read('.env'), /^VITE_API_MODE=real$/m)

for (const consumer of [
  'src/components/layout/AppShell.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/NotificationsPage.tsx',
  'src/pages/ProfilePage.tsx',
  'src/pages/NotificationPostPage.tsx',
]) {
  assert.match(read(consumer), /useNoticeRefresh\(\)/, `${consumer} must use the shared notice feed`)
}

console.log('Notice refresh frontend tests passed: 16 assertions')
