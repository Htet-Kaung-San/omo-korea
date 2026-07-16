/**
 * Scrape public PNU notice boards into raw_announcements.
 *
 * Usage (from backend/):
 *   node scripts/scrape-notices.mjs
 *
 * Env:
 *   SUPABASE_URL
 *   SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY
 *   SCRAPE_MAX_PER_SOURCE (optional, default 20)
 *   SCRAPE_DELAY_MS (optional, default 400)
 */
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
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
const MAX_PER_SOURCE = Number(process.env.SCRAPE_MAX_PER_SOURCE || 20);
const DELAY_MS = Number(process.env.SCRAPE_DELAY_MS || 400);

const USER_AGENT =
  'Mozilla/5.0 (compatible; HeyPNUBot/1.0; +https://github.com/hey-pnu; public notice indexer)';

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('placeholder')) {
  console.error('Missing SUPABASE_URL / service-role key in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toAbsoluteUrl(href, baseUrl) {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

/** Canonicalize so ?a=1&b=2 and duplicate mgr_seq still dedupe cleanly. */
function canonicalizeSourceUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    const params = new URLSearchParams(u.search);
    const keep = ['mCode', 'mode', 'mgr_seq', 'board_seq', 'articleNo', 'article.no'];
    const next = new URLSearchParams();
    for (const key of keep) {
      const value = params.get(key);
      if (value) next.set(key, value);
    }
    u.search = next.toString();
    return u.toString();
  } catch {
    return url;
  }
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }
  return response.text();
}

function stripChromeNoise($, root) {
  root.find('script, style, noscript, iframe, nav, header, footer').remove();
  root.find('.board-view-btns, .board-view-files, .board-view-filelist').remove();
  return normalizeWhitespace(root.text());
}

/** Main campus CMS boards: Board.do?mCode=... */
const pnuCmsBoard = {
  listArticleLinks(html, source) {
    const $ = cheerio.load(html);
    const articles = [];
    const seen = new Set();

    $('table.board-list-table tbody tr td.subject a[href*="mode=view"]').each((_, el) => {
      const href = $(el).attr('href');
      const absolute = toAbsoluteUrl(href, source.list_url);
      if (!absolute) return;
      const sourceUrl = canonicalizeSourceUrl(absolute);
      if (seen.has(sourceUrl)) return;
      seen.add(sourceUrl);

      const title = normalizeWhitespace($(el).text());
      if (!title) return;
      articles.push({ sourceUrl, title });
    });

    return articles.slice(0, MAX_PER_SOURCE);
  },

  articleText(html) {
    const $ = cheerio.load(html);
    const title = normalizeWhitespace($('h4.vtitle, .board-view-title .vtitle').first().text());
    const body = $('.board-view-contents').first();
    if (!body.length) {
      return {
        title,
        text: '',
        warning: 'Missing .board-view-contents — tighten selector for this board',
      };
    }
    const text = stripChromeNoise($, body);
    return { title, text };
  },
};

/** Department BBS: artclView.do / artclList.do pattern */
const pnuDeptBbs = {
  listArticleLinks(html, source) {
    const $ = cheerio.load(html);
    const articles = [];
    const seen = new Set();

    $('a[href*="artclView.do"], a[href*="mode=view"]').each((_, el) => {
      const href = $(el).attr('href');
      const absolute = toAbsoluteUrl(href, source.base_url || source.list_url);
      if (!absolute || !/artclView\.do|mode=view/i.test(absolute)) return;
      const sourceUrl = canonicalizeSourceUrl(absolute);
      if (seen.has(sourceUrl)) return;
      seen.add(sourceUrl);
      const title = normalizeWhitespace($(el).text());
      if (!title || title.length < 4) return;
      articles.push({ sourceUrl, title });
    });

    return articles.slice(0, MAX_PER_SOURCE);
  },

  articleText(html) {
    const $ = cheerio.load(html);
    const title = normalizeWhitespace(
      $('h1, h2, h3, .artclViewTitle, .view-title, .board-view-title').first().text(),
    );
    const candidates = [
      '.artclView .content',
      '#artclViewForm .content',
      '.view-content',
      '.board-view-contents',
      'article .content',
    ];
    let body = null;
    for (const sel of candidates) {
      const node = $(sel).first();
      if (node.length) {
        body = node;
        break;
      }
    }
    if (!body) {
      return { title, text: '', warning: 'No dept article body selector matched' };
    }
    return { title, text: stripChromeNoise($, body) };
  },
};

const parsers = {
  pnu_cms_board: pnuCmsBoard,
  pnu_dept_bbs: pnuDeptBbs,
};

async function scrapeSource(source) {
  const parser = parsers[source.parser_key];
  if (!parser) {
    console.warn(`Skip ${source.name}: unknown parser_key=${source.parser_key}`);
    return { inserted: 0, skipped: 0, errors: 1 };
  }

  console.log(`\n▶ ${source.name} (${source.parser_key})`);
  const listHtml = await fetchHtml(source.list_url);
  const articles = parser.listArticleLinks(listHtml, source);
  console.log(`  found ${articles.length} list links (cap ${MAX_PER_SOURCE})`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const article of articles) {
    const { data: existing, error: lookupError } = await supabase
      .from('raw_announcements')
      .select('id')
      .eq('source_url', article.sourceUrl)
      .maybeSingle();

    if (lookupError) {
      console.error(`  lookup error: ${lookupError.message}`);
      errors += 1;
      continue;
    }
    if (existing) {
      skipped += 1;
      continue;
    }

    try {
      await sleep(DELAY_MS);
      const detailHtml = await fetchHtml(article.sourceUrl);
      const { title, text, warning } = parser.articleText(detailHtml);
      if (warning) console.warn(`  ⚠ ${article.sourceUrl}: ${warning}`);
      if (!text || text.length < 40) {
        console.warn(`  ⚠ short/empty body for ${article.sourceUrl} (len=${text.length})`);
      }

      const { error: insertError } = await supabase.from('raw_announcements').insert({
        source_id: source.id,
        source_url: article.sourceUrl,
        title: title || article.title,
        raw_text: text,
        llm_processed: false,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          skipped += 1;
        } else {
          console.error(`  insert error: ${insertError.message}`);
          errors += 1;
        }
        continue;
      }

      inserted += 1;
      console.log(`  + ${title || article.title}`);
    } catch (err) {
      console.error(`  fetch/parse error for ${article.sourceUrl}: ${err.message}`);
      errors += 1;
    }
  }

  await supabase
    .from('notice_sources')
    .update({ last_scraped_at: new Date().toISOString() })
    .eq('id', source.id);

  return { inserted, skipped, errors };
}

async function main() {
  const { data: sources, error } = await supabase
    .from('notice_sources')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load notice_sources:', error.message);
    process.exit(1);
  }
  if (!sources?.length) {
    console.error('No active notice_sources. Run extracurricular_programs.sql seed first.');
    process.exit(1);
  }

  let totals = { inserted: 0, skipped: 0, errors: 0 };
  for (const source of sources) {
    const result = await scrapeSource(source);
    totals.inserted += result.inserted;
    totals.skipped += result.skipped;
    totals.errors += result.errors;
  }

  console.log('\nDone.', totals);
  if (totals.errors > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
