/**
 * Extract structured extracurricular programs from raw_announcements.
 * Inserts into extracurricular_program with status = pending_review only.
 * Never auto-publishes.
 *
 * Usage (from backend/):
 *   node scripts/extract-programs.mjs
 *
 * Modes:
 *   EXTRACT_MODE=claude     — requires ANTHROPIC_API_KEY (default when key is set)
 *   EXTRACT_MODE=heuristic  — keyword/date heuristics, no Anthropic (default when key missing)
 *
 * Env:
 *   SUPABASE_URL
 *   SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY (optional if heuristic)
 *   CLAUDE_MODEL (optional, default claude-sonnet-4-6)
 *   EXTRACT_BATCH_SIZE (optional, default 10)
 *   EXTRACT_MODE (optional: claude | heuristic)
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const BATCH_SIZE = Number(process.env.EXTRACT_BATCH_SIZE || 10);

const requestedMode = (process.env.EXTRACT_MODE || '').toLowerCase();
const EXTRACT_MODE =
  requestedMode === 'claude' || requestedMode === 'heuristic'
    ? requestedMode
    : ANTHROPIC_API_KEY
      ? 'claude'
      : 'heuristic';

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('placeholder')) {
  console.error('Missing SUPABASE_URL / service-role key in backend/.env');
  process.exit(1);
}
if (EXTRACT_MODE === 'claude' && !ANTHROPIC_API_KEY) {
  console.error('EXTRACT_MODE=claude requires ANTHROPIC_API_KEY (or use EXTRACT_MODE=heuristic)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let anthropic = null;
if (EXTRACT_MODE === 'claude') {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}

const SYSTEM_PROMPT = `You extract structured extracurricular (비교과) program data from Pusan National University public notice posts.

Return valid JSON only (no markdown fences) with this shape:
{
  "is_extracurricular": boolean,
  "name": string | null,
  "category": string | null,
  "description": string | null,
  "host_department": string | null,
  "interest_tags": string[],
  "apply_start": "YYYY-MM-DD" | null,
  "deadline": "YYYY-MM-DD" | null,
  "program_start": "YYYY-MM-DD" | null,
  "program_end": "YYYY-MM-DD" | null,
  "mileage_points": number | null,
  "external_apply_url": string | null
}

Rules:
- is_extracurricular=true only for programs students can join (clinics, camps, contests, tutoring, language courses, mentoring, career events, etc.).
- is_extracurricular=false for pure admin notices (tuition, crime alerts, internal staff notices, etc.).
- interest_tags: short lowercase snake_case tags such as career, korean_language, ai, coding, startup, research, counseling, exchange.
- external_apply_url: only if the post states a SEPARATE application URL (Google Form, jasoseol, etc.). Never put the notice board URL here.
- Dates: ISO YYYY-MM-DD when clear; otherwise null. Do not invent dates.
- description: 1-3 sentences in the post's language (usually Korean).
- If uncertain whether it is extracurricular, set is_extracurricular=false.`;

const POSITIVE_KEYWORDS = [
  '모집',
  '참가',
  '참여자',
  '클리닉',
  '캠프',
  '해커톤',
  '경진대회',
  '공모전',
  '튜터',
  '멘토',
  '특강',
  '세미나',
  '워크숍',
  '비교과',
  '봉사',
  '인턴',
  '교환',
  '파견',
  '어학',
  '토픽',
  'TOPIK',
  '창업',
  '교육생',
];

const NEGATIVE_KEYWORDS = [
  '등록금',
  '납부',
  '사칭',
  '부패행위',
  '집중신고',
  '주의 요청',
  '자동 로그인',
  '등록금 납부',
];

const TAG_RULES = [
  { tag: 'career', pattern: /취업|진로|자소서|자기소개서|면접|클리닉/i },
  { tag: 'startup', pattern: /창업|스타트업|유스콘/i },
  { tag: 'ai', pattern: /\bAI\b|인공지능|머신러닝|제미니|Gemini/i },
  { tag: 'coding', pattern: /코딩|프로그래밍|소프트웨어|SW|해커톤|블록체인/i },
  { tag: 'korean_language', pattern: /언어교육|한국어|TOPIK|토픽|외국어 특강/i },
  { tag: 'exchange', pattern: /교환|파견|해외/i },
  { tag: 'research', pattern: /연구|세미나|논문/i },
  { tag: 'counseling', pattern: /상담|심리/i },
];

function extractText(message) {
  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

function parseJsonResponse(text) {
  const cleaned = String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function toDateOrNull(value) {
  if (!value || typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [
    ...new Set(
      tags
        .map((tag) =>
          String(tag || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_가-힣]/g, ''),
        )
        .filter(Boolean),
    ),
  ].slice(0, 12);
}

function sameUrl(a, b) {
  if (!a || !b) return false;
  try {
    return new URL(a).href === new URL(b).href;
  } catch {
    return String(a).trim() === String(b).trim();
  }
}

function guessHostDepartment(title) {
  const match = String(title || '').match(/\[([^\]]{2,40})\]/);
  return match ? match[1].trim() : null;
}

function guessCategory(text) {
  if (/해커톤|경진대회|공모전/i.test(text)) return 'Competition';
  if (/캠프/i.test(text)) return 'Camp';
  if (/클리닉|상담/i.test(text)) return 'Clinic';
  if (/특강|세미나|교육|워크숍/i.test(text)) return 'Workshop';
  if (/멘토|튜터/i.test(text)) return 'Mentoring';
  if (/교환|파견/i.test(text)) return 'Exchange';
  return 'Program';
}

function extractIsoDates(text) {
  const iso = [...String(text || '').matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)].map(
    (m) => `${m[1]}-${m[2]}-${m[3]}`,
  );
  const dotted = [...String(text || '').matchAll(/\b(20\d{2})[./](\d{1,2})[./](\d{1,2})\b/g)].map(
    (m) =>
      `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`,
  );
  return [...new Set([...iso, ...dotted])].sort();
}

function extractExternalApplyUrl(text, sourceUrl) {
  const urls = [
    ...String(text || '').matchAll(/https?:\/\/[^\s"'<>]+/gi),
  ].map((m) => m[0].replace(/[),.;]+$/, ''));

  const applyLike = urls.find((url) =>
    /docs\.google\.com\/forms|forms\.gle|jasoseol\.com|typeform\.com|naver\.me|bit\.ly/i.test(
      url,
    ),
  );
  if (!applyLike) return null;
  if (sameUrl(applyLike, sourceUrl)) return null;
  return applyLike;
}

function extractWithHeuristic(row) {
  const title = String(row.title || '').trim();
  const body = String(row.raw_text || '').trim();
  const blob = `${title}\n${body}`;

  const negative = NEGATIVE_KEYWORDS.some((kw) => blob.includes(kw));
  const positive = POSITIVE_KEYWORDS.some((kw) => blob.includes(kw));
  const is_extracurricular = positive && !negative;

  const dates = extractIsoDates(blob);
  const deadlineHint = blob.match(/(?:마감|신청|접수|~)\s*[^\n]{0,20}?(\d{4}[-./]\d{1,2}[-./]\d{1,2})/);
  let deadline = null;
  if (deadlineHint) {
    deadline = toDateOrNull(
      deadlineHint[1].replace(/[./]/g, '-').replace(/-(\d)(?!\d)/g, '-0$1'),
    );
  }
  if (!deadline && dates.length) deadline = dates[dates.length - 1];

  const interest_tags = TAG_RULES.filter((rule) => rule.pattern.test(blob)).map((r) => r.tag);
  const description = body
    ? body.slice(0, 280).replace(/\s+/g, ' ').trim()
    : title || null;

  return {
    mode: 'heuristic',
    is_extracurricular,
    name: title || null,
    category: is_extracurricular ? guessCategory(blob) : null,
    description,
    host_department: guessHostDepartment(title),
    interest_tags,
    apply_start: dates[0] || null,
    deadline,
    program_start: null,
    program_end: null,
    mileage_points: null,
    external_apply_url: extractExternalApplyUrl(blob, row.source_url),
  };
}

async function extractWithClaude(row) {
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          source_url: row.source_url,
          title: row.title,
          raw_text: String(row.raw_text || '').slice(0, 12000),
        }),
      },
    ],
  });

  return {
    mode: 'claude',
    ...parseJsonResponse(extractText(message)),
  };
}

async function extractRow(row) {
  if (EXTRACT_MODE === 'claude') return extractWithClaude(row);
  return extractWithHeuristic(row);
}

async function processRow(row) {
  try {
    const extraction = await extractRow(row);
    const isExtra = Boolean(extraction.is_extracurricular);

    const { error: updateRawError } = await supabase
      .from('raw_announcements')
      .update({
        llm_processed: true,
        llm_extraction: extraction,
        is_extracurricular: isExtra,
        process_error: null,
      })
      .eq('id', row.id);

    if (updateRawError) {
      throw new Error(`raw update failed: ${updateRawError.message}`);
    }

    if (!isExtra) {
      console.log(`  · skip (not extracurricular): ${row.title || row.source_url}`);
      return { inserted: 0, skipped: 1, errors: 0 };
    }

    if (!row.source_url) {
      throw new Error('raw row missing source_url — refusing to insert program');
    }

    let externalApplyUrl = extraction.external_apply_url || null;
    if (externalApplyUrl && sameUrl(externalApplyUrl, row.source_url)) {
      externalApplyUrl = null;
    }

    const programRow = {
      name: extraction.name || row.title || 'Untitled program',
      category: extraction.category || null,
      description: extraction.description || null,
      host_department: extraction.host_department || null,
      interest_tags: normalizeTags(extraction.interest_tags),
      apply_start: toDateOrNull(extraction.apply_start),
      deadline: toDateOrNull(extraction.deadline),
      program_start: toDateOrNull(extraction.program_start),
      program_end: toDateOrNull(extraction.program_end),
      mileage_points:
        typeof extraction.mileage_points === 'number' ? extraction.mileage_points : null,
      source_url: row.source_url,
      external_apply_url: externalApplyUrl,
      status: 'pending_review',
      raw_announcement_id: row.id,
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('extracurricular_program')
      .insert(programRow);

    if (insertError) {
      throw new Error(`program insert failed: ${insertError.message}`);
    }

    console.log(`  + pending_review: ${programRow.name}`);
    return { inserted: 1, skipped: 0, errors: 0 };
  } catch (err) {
    console.error(`  ✗ ${row.id}: ${err.message}`);
    await supabase
      .from('raw_announcements')
      .update({
        process_error: String(err.message).slice(0, 1000),
      })
      .eq('id', row.id);
    return { inserted: 0, skipped: 0, errors: 1 };
  }
}

async function main() {
  const { data: rows, error } = await supabase
    .from('raw_announcements')
    .select('id, source_url, title, raw_text')
    .eq('llm_processed', false)
    .order('fetched_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('Failed to load raw_announcements:', error.message);
    process.exit(1);
  }
  if (!rows?.length) {
    console.log('No unprocessed raw_announcements.');
    return;
  }

  if (EXTRACT_MODE === 'heuristic') {
    console.log(
      `Processing ${rows.length} announcement(s) in heuristic mode (no Anthropic)…`,
    );
  } else {
    console.log(`Processing ${rows.length} announcement(s) with ${CLAUDE_MODEL}…`);
  }

  let totals = { inserted: 0, skipped: 0, errors: 0 };

  for (const row of rows) {
    const result = await processRow(row);
    totals.inserted += result.inserted;
    totals.skipped += result.skipped;
    totals.errors += result.errors;
  }

  console.log('\nDone.', totals);
  console.log('Remember: status stays pending_review — publish manually after checking source_url/dates.');
  if (totals.errors > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
