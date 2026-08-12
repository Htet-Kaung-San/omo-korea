const cheerio = require('cheerio');
const supabase = require('../supabaseClient');
const { localizeRow } = require('../middleware/languageMiddleware');

const PNU_BASE_URL = 'https://www.pusan.ac.kr';
const PNU_MENU_URL = `${PNU_BASE_URL}/kor/CMS/MenuMgr/menuListOnBuilding.do?mCode=MN202`;
const BUSAN_CAMPUS = 'PUSAN';
const CACHE_TTL_MS = 1000 * 60 * 60 * 3;

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const cache = new Map();
let scrapeInFlight = null;

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseGoSearchMenu(onclick) {
  const match = String(onclick || '').match(
    /goSearchMenu\s*\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/,
  );
  if (!match) return null;

  return {
    campus_gb: match[1],
    building_gb: match[2],
    restaurant_code: match[3],
    menu_date: match[4],
  };
}

async function fetchPnuHtml(params = {}) {
  const body = new URLSearchParams({
    campus_gb: params.campus_gb ?? BUSAN_CAMPUS,
    building_gb: params.building_gb ?? '',
    restaurant_code: params.restaurant_code ?? '',
    menu_date: params.menu_date ?? '',
    mobile_mode: '',
  });

  const response = await fetch(PNU_MENU_URL, {
    method: 'POST',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: PNU_MENU_URL,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`PNU menu fetch failed (${response.status})`);
  }

  return response.text();
}

function parseWeekRange(text) {
  const match = normalizeWhitespace(text).match(
    /(\d{2})월\s*(\d{2})일\s*~\s*(\d{2})월\s*(\d{2})일/,
  );
  if (!match) {
    return { week_start: null, week_end: null, week_label: null };
  }

  const year = new Date().getFullYear();
  const week_start = `${year}-${match[1]}-${match[2]}`;
  const week_end = `${year}-${match[3]}-${match[4]}`;

  return {
    week_start,
    week_end,
    week_label: `${match[1]}월 ${match[2]}일 ~ ${match[3]}월 ${match[4]}일`,
  };
}

function parseItemsFromParagraph($p) {
  const html = $p.html();
  if (!html) return [];
  return html
    .split(/<br\s*\/?>/i)
    .map((item) => normalizeWhitespace(item.replace(/<[^>]+>/g, '')))
    .filter(Boolean);
}

function parseMealOption($, block) {
  const price = normalizeWhitespace($(block).find('h3.menu-tit01').first().text());
  const items = parseItemsFromParagraph($(block).find('p').first());
  if (!price && items.length === 0) return null;
  return {
    price: price || null,
    items,
  };
}

/**
 * A single day cell often contains multiple menu options (e.g. 정식 + 일품),
 * each as `ul > li` with its own h3 price title and p dish list.
 */
function parseMealItems(_cellHtml, $, cell) {
  const optionBlocks = $(cell).find('ul > li');
  let options = optionBlocks
    .map((_, li) => parseMealOption($, li))
    .get()
    .filter(Boolean);

  // Fallback when markup is not wrapped in ul/li
  if (options.length === 0) {
    const titles = $(cell).find('h3.menu-tit01');
    if (titles.length > 0) {
      options = titles
        .map((_, h3) => {
          const $h3 = $(h3);
          const price = normalizeWhitespace($h3.text());
          const $p = $h3.nextAll('p').first();
          const items = parseItemsFromParagraph($p);
          if (!price && items.length === 0) return null;
          return { price: price || null, items };
        })
        .get()
        .filter(Boolean);
    } else {
      const items = parseItemsFromParagraph($(cell).find('p').first());
      if (items.length > 0) options = [{ price: null, items }];
    }
  }

  if (options.length === 0) {
    return { price: null, items: [], options: [], note: null };
  }

  // Keep top-level price/items as the first option for backward compatibility
  return {
    price: options[0].price,
    items: options[0].items,
    options,
    note: null,
  };
}

function parseMealTable($) {
  const table = $('table.menu-tbl.type-day').first();
  if (!table.length) {
    throw new Error('Unable to find cafeteria menu table on PNU page');
  }

  const columnHeaders = table
    .find('thead th')
    .slice(1)
    .map((index, th) => {
      const day = normalizeWhitespace($(th).find('.day').text());
      const date = normalizeWhitespace($(th).find('.date').text());
      return {
        day: DAY_KEYS[index] ?? `day-${index}`,
        day_label: date ? `${day} ${date}` : day,
      };
    })
    .get();

  const rows = table
    .find('tbody tr')
    .map((_, tr) => {
      const headerCell = $(tr).find('th').first();
      const meal_label = (headerCell.html() ?? '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .split('\n')
        .map((part) => normalizeWhitespace(part))
        .filter(Boolean)
        .join('\n');
      const meal_type = meal_label.split('\n')[0] || meal_label;

      if (/미운영/.test(meal_label) && $(tr).find('td ul li').length === 0) {
        return {
          meal_type,
          meal_label,
          columns: columnHeaders
            .filter((column) => column.day !== 'sat')
            .map((column) => ({
              ...column,
              price: null,
              items: [],
              options: [],
              note: '미운영',
            })),
        };
      }

      const cells = $(tr).find('td');
      const columns = columnHeaders
        .filter((column) => column.day !== 'sat')
        .map((column, index) => {
          const cell = cells.eq(index);
          const parsed = parseMealItems(cell.html(), $, cell);
          return {
            ...column,
            ...parsed,
          };
        });

      return {
        meal_type,
        meal_label,
        columns,
      };
    })
    .get();

  return rows;
}

function parseDiningHallTabs(html) {
  const $ = cheerio.load(html);
  const tabs = [];

  $('#childTab ul > li a[onclick]').each((_, anchor) => {
    const params = parseGoSearchMenu($(anchor).attr('onclick'));
    const label = normalizeWhitespace($(anchor).find('span').text() || $(anchor).text());
    if (!params || !label) return;
    if (params.campus_gb !== BUSAN_CAMPUS) return;

    tabs.push({
      label,
      ...params,
      facility_key: `busan-${slugify(label)}`,
    });
  });

  return tabs;
}

function parseWeekNavigation($) {
  const prev = parseGoSearchMenu($('.menu-navi button.prev').attr('onclick'));
  const next = parseGoSearchMenu($('.menu-navi button.next').attr('onclick'));

  return {
    prev_menu_date: prev?.menu_date || null,
    next_menu_date: next?.menu_date || null,
  };
}

function parseMenuPage(html, tab) {
  const $ = cheerio.load(html);
  const weekText = $('.menu-navi .loca').first().text();
  const { week_start, week_end, week_label } = parseWeekRange(weekText);
  const { prev_menu_date, next_menu_date } = parseWeekNavigation($);
  const rows = parseMealTable($);

  return {
    facility_key: tab.facility_key,
    campus: '부산캠퍼스',
    dining_hall: tab.label,
    week_start,
    week_end,
    week_label,
    prev_menu_date,
    next_menu_date,
    meals: rows,
    source_url: PNU_MENU_URL,
    scraped_at: new Date().toISOString(),
  };
}

async function scrapeBusanCafeteriaMenus({ menuDate = '' } = {}) {
  const busanHtml = await fetchPnuHtml({ campus_gb: BUSAN_CAMPUS, menu_date: menuDate });
  const tabs = parseDiningHallTabs(busanHtml);

  if (tabs.length === 0) {
    throw new Error('No Busan cafeteria tabs found on PNU page');
  }

  const cafeterias = [];

  for (const tab of tabs) {
    const html = await fetchPnuHtml({
      campus_gb: tab.campus_gb,
      building_gb: tab.building_gb,
      restaurant_code: tab.restaurant_code,
      menu_date: menuDate,
    });
    cafeterias.push(parseMenuPage(html, tab));
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return {
    cafeterias,
    scrapedAt: new Date().toISOString(),
    source: 'pusan.ac.kr',
    menu_date: menuDate || null,
  };
}

async function syncCafeteriaMenusToSupabase(cafeterias) {
  const rows = cafeterias.map((item) => ({
    facility_key: item.facility_key,
    campus: item.campus,
    dining_hall: item.dining_hall,
    week_start: item.week_start,
    week_end: item.week_end,
    meals: item.meals,
    source_url: item.source_url,
    scraped_at: item.scraped_at,
  }));

  const { error } = await supabase.from('cafeteria_menu').upsert(rows, {
    onConflict: 'facility_key',
  });

  if (error) {
    console.warn('[pnuCafeteriaMenuScraperService] Supabase upsert failed:', error.message);
  }
}

async function readCafeteriaMenusFromSupabase() {
  const { data, error } = await supabase
    .from('cafeteria_menu')
    .select('*')
    .eq('campus', '부산캠퍼스')
    .order('dining_hall', { ascending: true });

  if (error) {
    console.warn('[pnuCafeteriaMenuScraperService] Supabase read failed:', error.message);
    return [];
  }

  return data ?? [];
}

function formatStoredWeekLabel(weekStart, weekEnd) {
  if (!weekStart || !weekEnd) return null;
  const start = weekStart.split('-');
  const end = weekEnd.split('-');
  if (start.length !== 3 || end.length !== 3) return `${weekStart} ~ ${weekEnd}`;
  return `${start[1]}월 ${start[2]}일 ~ ${end[1]}월 ${end[2]}일`;
}

function mapCafeteriaItem(item, language = 'en') {
  const localized = localizeRow(item, language, ['dining_hall']);

  return {
    id: item.facility_key,
    name: localized.dining_hall ?? item.dining_hall,
    menu: {
      week_start: item.week_start,
      week_end: item.week_end,
      week_label: item.week_label,
      prev_menu_date: item.prev_menu_date ?? null,
      next_menu_date: item.next_menu_date ?? null,
      rows: item.meals,
    },
  };
}

function mapStoredRow(row, language = 'en') {
  const localized = localizeRow(row, language, ['dining_hall']);

  return {
    id: row.facility_key,
    name: localized.dining_hall ?? row.dining_hall,
    menu: {
      week_start: row.week_start,
      week_end: row.week_end,
      week_label: formatStoredWeekLabel(row.week_start, row.week_end),
      prev_menu_date: null,
      next_menu_date: null,
      rows: row.meals ?? [],
    },
  };
}

async function scrapeAndCacheCafeteriaMenus({ menuDate = '', forceRefresh = false } = {}) {
  const cacheKey = menuDate || 'current';
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (!forceRefresh && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.scraped;
  }

  // Dedupe concurrent live scrapes (pre-scrape scheduler + request-path warm).
  if (scrapeInFlight) {
    try {
      return await scrapeInFlight;
    } catch {
      // Fall through and start a fresh scrape if the in-flight one failed.
    }
  }

  const job = (async () => {
    const scraped = await scrapeBusanCafeteriaMenus({ menuDate });
    await syncCafeteriaMenusToSupabase(scraped.cafeterias);
    const payload = {
      cafeterias: scraped.cafeterias,
      cafeteria_source: scraped.source,
      scraped_at: scraped.scrapedAt,
      menu_date: scraped.menu_date,
    };
    cache.set(cacheKey, { fetchedAt: Date.now(), scraped: payload });
    return payload;
  })();

  scrapeInFlight = job;
  try {
    return await job;
  } finally {
    scrapeInFlight = null;
  }
}

async function getBusanCafeteriaMenus({ menuDate = '', forceRefresh = false, language = 'en', nonBlocking = false } = {}) {
  const cacheKey = menuDate || 'current';
  const now = Date.now();
  const cached = cache.get(cacheKey);

  // 1. Memory cache hit (<1ms)
  if (!forceRefresh && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return {
      cafeterias: cached.scraped.cafeterias.map((item) => mapCafeteriaItem(item, language)),
      cafeteria_source: cached.scraped.cafeteria_source,
      scraped_at: cached.scraped.scraped_at,
      menu_date: cached.scraped.menu_date,
    };
  }

  // 2. Query Supabase DB (<20ms) before attempting slow live scrape
  if (!forceRefresh) {
    const stored = await readCafeteriaMenusFromSupabase();
    if (stored.length > 0) {
      const latestScrapedAt = stored.reduce((latest, row) => {
        const ts = row.scraped_at ? new Date(row.scraped_at).getTime() : 0;
        return ts > latest ? ts : latest;
      }, 0);

      const cafeteriasFromDb = stored.map((row) => ({
        facility_key: row.facility_key,
        campus: row.campus,
        dining_hall: row.dining_hall,
        week_start: row.week_start,
        week_end: row.week_end,
        meals: row.meals ?? [],
        source_url: row.source_url,
        scraped_at: row.scraped_at,
      }));

      const payload = {
        cafeterias: cafeteriasFromDb,
        cafeteria_source: 'supabase',
        scraped_at: latestScrapedAt ? new Date(latestScrapedAt).toISOString() : null,
        menu_date: menuDate || null,
      };

      // Populate memory cache for subsequent instant hits
      cache.set(cacheKey, { fetchedAt: now, scraped: payload });

      // Trigger background non-blocking refresh if DB data is older than TTL
      const ageMs = now - latestScrapedAt;
      if (latestScrapedAt === 0 || ageMs > CACHE_TTL_MS) {
        scrapeAndCacheCafeteriaMenus({ menuDate, forceRefresh: true }).catch((err) =>
          console.warn('[pnuCafeteriaMenuScraperService] Background refresh failed:', err.message),
        );
      }

      return {
        cafeterias: payload.cafeterias.map((item) => mapCafeteriaItem(item, language)),
        cafeteria_source: payload.cafeteria_source,
        scraped_at: payload.scraped_at,
        menu_date: payload.menu_date,
      };
    }
  }

  // 3. Fallback synchronous scrape if Supabase is completely empty.
  //    When nonBlocking is requested (request path), kick off the scrape in the
  //    background and return empty now — the caller serves fallback data.
  if (nonBlocking) {
    scrapeAndCacheCafeteriaMenus({ menuDate, forceRefresh: true }).catch((err) =>
      console.warn('[pnuCafeteriaMenuScraperService] Background cold scrape failed:', err.message),
    );
    return {
      cafeterias: [],
      cafeteria_source: 'pending',
      scraped_at: null,
      menu_date: menuDate || null,
    };
  }

  try {
    const payload = await scrapeAndCacheCafeteriaMenus({ menuDate, forceRefresh: true });
    return {
      cafeterias: payload.cafeterias.map((item) => mapCafeteriaItem(item, language)),
      cafeteria_source: payload.cafeteria_source,
      scraped_at: payload.scraped_at,
      menu_date: payload.menu_date,
    };
  } catch (error) {
    console.warn('[pnuCafeteriaMenuScraperService] Live scrape fallback failed:', error.message);
    throw error;
  }
}

module.exports = {
  scrapeBusanCafeteriaMenus,
  scrapeAndCacheCafeteriaMenus,
  getBusanCafeteriaMenus,
  syncCafeteriaMenusToSupabase,
};
