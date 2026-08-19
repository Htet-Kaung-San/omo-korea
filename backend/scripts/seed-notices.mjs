/**
 * Scrape recent notices from the configured public PNU sources into Supabase.
 *
 * External schedulers can run:
 *   npm run seed:notices
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'module'
import WebSocket from 'ws'

const require = createRequire(import.meta.url)
const { scrapeRecentNotices } = require('../services/pnuNoticeScraperService.js')
const { synchronizeNotices } = require('../services/noticeSyncService.js')
const { describeSourceProblems } = require('../services/noticeSourceHealth.js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
  console.error('Configure real SUPABASE_URL / SUPABASE_KEY in backend/.env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: WebSocket },
})
const { error: schemaError } = await supabase
  .from('notice')
  .select('source_url')
  .limit(1)

if (schemaError) {
  console.error('\nSchema not ready:', schemaError.message)
  console.error('Run backend/supabase/notice_source.sql in the Supabase SQL Editor')
  process.exit(1)
}

const result = await synchronizeNotices({
  supabaseClient: supabase,
  scrapeNotices: scrapeRecentNotices,
})
const notices = result.scraped

console.log(`Scraped ${notices.length} notices within 1 month`)
console.log(
  'By source:',
  notices.reduce((counts, item) => {
    counts[item.source] = (counts[item.source] || 0) + 1
    return counts
  }, {}),
)
console.log(
  `Synchronized: ${result.inserted} inserted, ${result.updated} updated, ${result.unchanged} unchanged`,
)

if (result.knowledgeBase && !result.knowledgeBase.error) {
  const kb = result.knowledgeBase
  console.log(
    `Knowledge base: ${kb.created} added, ${kb.updated} updated, ${kb.embedded} embedded, ${kb.pruned} pruned` +
      (kb.embeddingSkipped ? ' (no embedding key — documents written unembedded)' : ''),
  )
}

// Exit non-zero when a board is broken, so the scheduled run goes red instead
// of reporting success. Every failure mode here used to be invisible: a 404
// was a console warning nobody reads, and a board whose markup changed
// contributed nothing at all with no error. e-onestop.pusan.ac.kr was dead for
// weeks this way.
const health = result.sourceHealth
if (health?.checkFailed) {
  console.warn(`\nCould not verify notice sources: ${health.checkFailed}`)
} else if (health) {
  console.log(
    'Sources healthy:',
    health.healthy.map((s) => `${s.source}(${s.count})`).join(' ') || 'none',
  )
  if (health.problems.length > 0) {
    console.error(`\n${health.problems.length} notice source(s) are not working:`)
    console.error(describeSourceProblems(health.problems))
    console.error(
      '\nOther sources synced normally, so the notices above are simply missing rather than wrong.',
    )
    process.exit(1)
  }
}
