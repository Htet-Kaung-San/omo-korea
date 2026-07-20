const cheerio = require('cheerio')

const ONE_MONTH_MS = 1000 * 60 * 60 * 24 * 30
const MAX_PAGES = 8

const BOARDS = [
  {
    source: 'international',
    label: 'PNU International',
    origin: 'https://international.pusan.ac.kr',
    listPath: '/bbs/international/2081/artclList.do',
    language: 'Korean',
  },
  {
    source: 'cse',
    label: 'CSE Department',
    origin: 'https://cse.pusan.ac.kr',
    listPath: '/bbs/cse/2055/artclList.do',
    language: 'Korean',
  },
]

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseBoardDate(value) {
  const match = normalizeWhitespace(value).match(/^(\d{4})\.(\d{2})\.(\d{2})$/)
  if (!match) return null
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00+09:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function absoluteUrl(origin, href) {
  try {
    return new URL(href, origin).toString()
  } catch {
    return null
  }
}

function extractExternalId(href) {
  const match = String(href || '').match(/\/(\d+)\/artclView\.do/)
  return match ? match[1] : null
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    throw new Error(`Notice board fetch failed (${response.status}): ${url}`)
  }

  return response.text()
}

function parseListPage(html, board) {
  const $ = cheerio.load(html)
  const items = []

  $('table.board-table tbody tr').each((_, tr) => {
    const anchor = $(tr).find('a[href*="artclView"]').first()
    if (!anchor.length) return

    const href = anchor.attr('href')
    const title = normalizeWhitespace(anchor.text()).replace(/\s*새글\s*$/u, '').trim()
    if (!href || !title) return

    const cells = $(tr)
      .find('td')
      .map((__, td) => normalizeWhitespace($(td).text()))
      .get()

    const dateText = cells.find((cell) => /^\d{4}\.\d{2}\.\d{2}$/.test(cell))
    const postedDate = parseBoardDate(dateText)
    if (!postedDate) return

    const sourceUrl = absoluteUrl(board.origin, href)
    if (!sourceUrl) return

    const badge = cells[0] && !/^\d+$/.test(cells[0]) ? cells[0] : null
    const contentParts = [badge ? `[${badge}]` : null, title, `Source: ${board.label}`].filter(
      Boolean,
    )

    items.push({
      title: title.slice(0, 500),
      content: contentParts.join('\n'),
      language: board.language,
      posted_date: postedDate.toISOString(),
      source: board.source,
      source_url: sourceUrl,
      external_id: extractExternalId(href),
      scraped_at: new Date().toISOString(),
      _postedMs: postedDate.getTime(),
    })
  })

  return items
}

async function scrapeBoard(board, { sinceMs = Date.now() - ONE_MONTH_MS } = {}) {
  const byUrl = new Map()
  let reachedOlder = false

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url =
      page === 1
        ? `${board.origin}${board.listPath}`
        : `${board.origin}${board.listPath}?page=${page}`

    const html = await fetchHtml(url)
    const items = parseListPage(html, board)
    if (items.length === 0) break

    let freshOnPage = 0
    for (const item of items) {
      if (item._postedMs < sinceMs) {
        reachedOlder = true
        continue
      }
      freshOnPage += 1
      if (!byUrl.has(item.source_url)) {
        byUrl.set(item.source_url, item)
      }
    }

    // Sticky old notices appear on every page; stop when a page adds nothing fresh
    // and we already saw older posts.
    if (freshOnPage === 0 && (reachedOlder || page > 1)) break
  }

  return [...byUrl.values()].map(({ _postedMs, ...row }) => row)
}

async function scrapeRecentNotices(options = {}) {
  const sinceMs = options.sinceMs ?? Date.now() - ONE_MONTH_MS
  const boards = options.boards ?? BOARDS
  const all = []

  for (const board of boards) {
    const items = await scrapeBoard(board, { sinceMs })
    all.push(...items)
  }

  all.sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime())
  return all
}

function mapNoticeRow(row) {
  const source = row.source || null
  const channel =
    source === 'international' ? 'international' : source === 'cse' ? 'department' : 'general'
  const sourceLabel =
    source === 'international'
      ? 'PNU International'
      : source === 'cse'
        ? 'CSE Department'
        : source

  return {
    id: String(row.notice_id),
    title: row.title,
    body: row.content,
    date: row.posted_date,
    category: 'GENERAL',
    priority: 'NORMAL',
    source: sourceLabel,
    channel,
    sourceUrl: row.source_url || null,
    read: false,
  }
}

module.exports = {
  BOARDS,
  ONE_MONTH_MS,
  scrapeRecentNotices,
  scrapeBoard,
  mapNoticeRow,
}
