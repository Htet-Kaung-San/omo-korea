/**
 * Scrape PNU public academic calendar (CMS) into JSON for the frontend.
 *
 * Usage (from backend/):
 *   node scripts/scrape-academic-calendar.mjs
 */
import * as cheerio from 'cheerio'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../../frontend/src/data/academicCalendar.events.json')

const USER_AGENT =
  'Mozilla/5.0 (compatible; HeyPNUBot/1.0; +https://github.com/hey-pnu; public calendar indexer)'

const CMS_URL = 'https://www.pusan.ac.kr/kor/CMS/Haksailjung/view.do?mCode=MN076'

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseDateRange(text) {
  const cleaned = normalizeWhitespace(text).replace(/\(.*?\)/g, '')
  const m = cleaned.match(
    /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2}).*?(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
  )
  if (m) {
    return {
      start: `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`,
      end: `${m[4]}-${String(m[5]).padStart(2, '0')}-${String(m[6]).padStart(2, '0')}`,
    }
  }
  const single = cleaned.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (single) {
    const d = `${single[1]}-${String(single[2]).padStart(2, '0')}-${String(single[3]).padStart(2, '0')}`
    return { start: d, end: d }
  }
  return null
}

function inferSemester(title, start) {
  if (/2학기|겨울계절|겨울도약/.test(title)) return 2
  if (/1학기|신입생|입학식|여름계절|여름도약/.test(title)) return 1
  const month = Number(start.slice(5, 7))
  return month >= 3 && month <= 8 ? 1 : 2
}

function inferYear(title, start) {
  const m = title.match(/(20\d{2})\s*학년도|(20\d{2})\s*년도/)
  if (m) return Number(m[1] || m[2])
  const y = Number(start.slice(0, 4))
  const month = Number(start.slice(5, 7))
  if (month <= 2) return y - 1
  return y
}

function extractCmsTable(html) {
  const $ = cheerio.load(html)
  const events = []

  $('table tbody tr').each((_, tr) => {
    const dateText = normalizeWhitespace($(tr).find('th.term, th').first().text())
    const title = normalizeWhitespace($(tr).find('td.text, td').first().text())
    if (!dateText || !title) return
    if (title === '내용' || dateText === '일정') return

    const range = parseDateRange(dateText)
    if (!range) return
    if (range.start < '2025-01-01' || range.start > '2030-12-31') return

    events.push({
      start: range.start,
      end: range.end,
      titleKo: title,
    })
  })

  return events
}

/** Past/early-year events no longer on the rolling CMS page (from official 2026 notice). */
const SEMESTER1_SEED = [
  ['2025-10-31', '2025-11-06', '2026년도 1학기 휴·복학 신청기간'],
  ['2025-10-31', '2025-11-06', '2026년도 겨울계절 및 도약수업 복학신청기간'],
  ['2026-02-03', '2026-02-04', '2026년도 1학기 희망과목담기'],
  ['2026-02-05', '2026-02-05', '2026년도 1학기 자동신청결과확인'],
  ['2026-02-10', '2026-02-12', '2026년도 1학기 수강신청(학부)'],
  ['2026-02-10', '2026-02-12', '2026년도 1학기 수강신청(대학원)'],
  ['2026-02-10', '2026-02-12', '2026년도 1학기 수강신청(타대생)'],
  ['2026-02-10', '2026-02-12', '2026년도 1학기 대기순번제 적용기간'],
  ['2026-02-19', '2026-02-20', '2026년도 1학기 수강신청(학부)'],
  ['2026-02-19', '2026-02-20', '2026년도 1학기 수강신청(대학원)'],
  ['2026-02-19', '2026-02-20', '2026년도 1학기 수강신청(타대생)'],
  ['2026-02-23', '2026-02-26', '2026년도 1학기 휴·복학 신청기간'],
  ['2026-02-23', '2026-02-26', '2026년도 1학기 등록금납부'],
  ['2026-02-26', '2026-02-26', '2026년도 1학기 1차 폐강강좌 공고'],
  ['2026-03-02', '2026-03-02', '2026년도 신입생 오리엔테이션'],
  ['2026-03-03', '2026-03-03', '2026년도 신입생 입학식, 1학기 개강'],
  ['2026-03-03', '2026-03-09', '2026년도 1학기 수강정정(학부,타대생)'],
  ['2026-03-03', '2026-03-09', '2026년도 1학기 수강정정(대학원)'],
  ['2026-03-16', '2026-03-16', '2026년도 1학기 2차 폐강강좌 공고'],
  ['2026-03-17', '2026-03-18', '2026년도 1학기 수강정정(학부,타대생)'],
  ['2026-03-17', '2026-03-18', '2026년도 1학기 수강정정(대학원)'],
  ['2026-03-19', '2026-03-19', '2026년도 1학기 확정출석부 출력'],
  ['2026-03-24', '2026-03-26', '2026년도 1학기 재학생 등록금납부'],
  ['2026-03-24', '2026-03-26', '2026년도 1학기 휴·복학 신청기간'],
  ['2026-03-31', '2026-04-06', '2026년도 1학기 수강취소'],
  ['2026-04-06', '2026-04-06', '2026년도 1학기 수업일수 1/3선'],
  ['2026-04-20', '2026-04-25', '2026년도 1학기 중간고사'],
  ['2026-04-23', '2026-04-23', '2026년도 1학기 수업일수 1/2선'],
  ['2026-04-24', '2026-04-30', '2026년도 2학기 계절 및 도약수업 복학신청기간'],
  ['2026-05-06', '2026-05-07', '2026년도 여름계절수업 희망과목담기'],
  ['2026-05-08', '2026-05-08', '2026년도 여름계절수업 자동신청결과확인'],
  ['2026-05-12', '2026-05-14', '2026년도 여름계절수업 재학생 수강신청(학부)'],
  ['2026-05-12', '2026-05-14', '2026년도 여름계절수업 재학생 수강신청(대학원)'],
  ['2026-05-12', '2026-05-14', '2026년도 여름계절수업 수강신청(타대생)'],
  ['2026-05-13', '2026-05-13', '2026년도 1학기 수업일수 2/3선'],
  ['2026-05-21', '2026-05-21', '2026년도 여름계절수업 1차 폐강강좌 공고'],
  ['2026-05-22', '2026-05-26', '2026년도 여름계절수업 수강정정(학부,타대생)'],
  ['2026-05-22', '2026-05-26', '2026년도 여름계절수업 수강정정(대학원)'],
  ['2026-06-02', '2026-06-02', '2026년도 여름계절수업 2차 폐강강좌 공고'],
  ['2026-06-04', '2026-06-05', '2026년도 여름계절수업 수강정정(학부,타대생)'],
  ['2026-06-04', '2026-06-05', '2026년도 여름계절수업 수강정정(대학원)'],
  ['2026-06-12', '2026-06-16', '2026년도 여름계절수업 등록금납부'],
  ['2026-06-12', '2026-06-16', '2026년도 여름도약수업 등록금납부'],
  ['2026-06-16', '2026-06-22', '2026년도 1학기 기말고사'],
  ['2026-06-23', '2026-06-23', '2026년도 1학기 여름휴가 시작'],
]

function toEvent(start, end, titleKo, index) {
  const year = inferYear(titleKo, start)
  const semester = inferSemester(titleKo, start)
  return {
    id: `${year}-${semester}-${String(index).padStart(3, '0')}`,
    year,
    semester,
    startAt: `${start}T00:00:00+09:00`,
    endAt: `${end}T23:59:59+09:00`,
    titleKo,
  }
}

function dedupe(events) {
  const map = new Map()
  for (const event of events) {
    const key = `${event.startAt}|${event.endAt}|${event.titleKo}`
    if (!map.has(key)) map.set(key, event)
  }
  return [...map.values()].sort(
    (a, b) =>
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime() ||
      a.titleKo.localeCompare(b.titleKo, 'ko'),
  )
}

async function main() {
  const res = await fetch(CMS_URL, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
  })
  const html = await res.text()
  const cms = extractCmsTable(html)
  console.log('CMS rows', cms.length, 'status', res.status)

  const seed = SEMESTER1_SEED.map(([start, end, title], i) => {
    const event = toEvent(start, end, title, i + 1)
    // Seed rows belong on the 1학기 timeline unless explicitly labeled 2학기.
    if (!/2학기/.test(title)) {
      event.semester = 1
      event.year = 2026
    }
    return event
  })
  const fromCms = cms.map((row, i) =>
    toEvent(row.start, row.end, row.titleKo, seed.length + i + 1),
  )

  const merged = dedupe([...seed, ...fromCms]).map((event, index) => ({
    ...event,
    id: `${event.year}-${event.semester}-${String(index + 1).padStart(3, '0')}`,
  }))

  writeFileSync(OUT, JSON.stringify(merged, null, 2), 'utf8')
  console.log('wrote', OUT)
  console.log(
    'total',
    merged.length,
    'sem1',
    merged.filter((e) => e.semester === 1).length,
    'sem2',
    merged.filter((e) => e.semester === 2).length,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
