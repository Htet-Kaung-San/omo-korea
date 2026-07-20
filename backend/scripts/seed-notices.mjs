/**
 * Scrape PNU International + CSE notices (last ~30 days) into Supabase `notice`.
 *
 * Prerequisite: run backend/supabase/notice_source.sql in the Supabase SQL Editor once.
 *
 *   npm run seed:notices
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { scrapeRecentNotices } = require('../services/pnuNoticeScraperService.js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
  console.error('Configure real SUPABASE_URL / SUPABASE_KEY in backend/.env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function upsertNotices(rows) {
  if (rows.length === 0) return { inserted: 0, updated: 0 }

  let inserted = 0
  let updated = 0

  for (const row of rows) {
    const { data: existing, error: lookupError } = await supabase
      .from('notice')
      .select('notice_id')
      .eq('source_url', row.source_url)
      .maybeSingle()

    if (lookupError) throw lookupError

    if (existing?.notice_id) {
      const { error } = await supabase
        .from('notice')
        .update({
          title: row.title,
          content: row.content,
          language: row.language,
          posted_date: row.posted_date,
          source: row.source,
          external_id: row.external_id,
          scraped_at: row.scraped_at,
        })
        .eq('notice_id', existing.notice_id)
      if (error) throw error
      updated += 1
    } else {
      const { error } = await supabase.from('notice').insert({
        title: row.title,
        content: row.content,
        language: row.language,
        posted_date: row.posted_date,
        source: row.source,
        source_url: row.source_url,
        external_id: row.external_id,
        scraped_at: row.scraped_at,
      })
      if (error) throw error
      inserted += 1
    }
  }

  return { inserted, updated }
}

const notices = await scrapeRecentNotices()
console.log(`Scraped ${notices.length} notices within 1 month`)

const bySource = notices.reduce((acc, item) => {
  acc[item.source] = (acc[item.source] || 0) + 1
  return acc
}, {})
console.log('By source:', bySource)

const { error: probeError } = await supabase.from('notice').select('source_url').limit(1)
if (probeError) {
  console.error('\nSchema not ready:', probeError.message)
  console.error('In Supabase Dashboard → SQL Editor, run:')
  console.error('  backend/supabase/notice_source.sql')
  process.exit(1)
}

const result = await upsertNotices(notices)
console.log(`Upserted: ${result.inserted} inserted, ${result.updated} updated`)
