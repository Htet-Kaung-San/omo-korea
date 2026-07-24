/**
 * Scrape recent PNU International and CSE notices into Supabase.
 *
 * External schedulers can run:
 *   npm run seed:notices
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { scrapeRecentNotices } = require('../services/pnuNoticeScraperService.js')
const { synchronizeNotices } = require('../services/noticeSyncService.js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
  console.error('Configure real SUPABASE_URL / SUPABASE_KEY in backend/.env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
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
console.log(`Upserted: ${result.inserted} inserted, ${result.updated} updated`)
