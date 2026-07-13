const cheerio = require('cheerio');
const supabase = require('../supabaseClient');
const { localizeRow } = require('../middleware/languageMiddleware');

const PNU_BASE_URL = 'https://www.pusan.ac.kr';
const PNU_MENU_URL = `${PNU_BASE_URL}/kor/CMS/MenuMgr/menuListOnBuilding.do?mCode=MN202`;
const BUSAN_CAMPUS = 'PUSAN';
const CACHE_TTL_MS = 1000 * 60 * 5;

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const cache = new Map();

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

function parseMealItems(cellHtml, $, cell) {
  const price = normalizeWhitespace($(cell).find('h3.menu-tit01').first().text());
  const rawItems = $(cell)
    .find('p')
    .html()
    ?.split(/<br\s*\/?>/i)
    .map((item) => normalizeWhitespace(item.replace(/<[^>]+>/g, '')))
    .filter(Boolean);

  if (!price && (!rawItems || rawItems.length === 0)) {
    return { price: null, items: [], note: null };
  }

  return {
    price: price || null,
    items: rawItems ?? [],
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
          columns: columnHeaders.map((column) => ({
            ...column,
            price: null,
            items: [],
            note: '미운영',
          })),
        };
      }

      const cells = $(tr).find('td');
      const columns = columnHeaders.map((column, index) => {
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

async function getBusanCafeteriaMenus({ menuDate = '', forceRefresh = false, language = 'en' } = {}) {
  const cacheKey = menuDate || 'current';
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (!forceRefresh && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const scraped = await scrapeBusanCafeteriaMenus({ menuDate });
    await syncCafeteriaMenusToSupabase(scraped.cafeterias);
    const payload = {
      cafeterias: scraped.cafeterias.map((item) => mapCafeteriaItem(item, language)),
      cafeteria_source: scraped.source,
      scraped_at: scraped.scrapedAt,
      menu_date: scraped.menu_date,
    };
    cache.set(cacheKey, { fetchedAt: now, data: payload });
    return payload;
  } catch (error) {
    console.warn('[pnuCafeteriaMenuScraperService] Scrape failed:', error.message);
    const stored = await readCafeteriaMenusFromSupabase();
    if (stored.length > 0) {
      const latestScrapedAt = stored.reduce((latest, row) => {
        const ts = row.scraped_at ? new Date(row.scraped_at).getTime() : 0;
        return ts > latest ? ts : latest;
      }, 0);
      return {
        cafeterias: stored.map((row) => mapStoredRow(row, language)),
        cafeteria_source: 'supabase',
        scraped_at: latestScrapedAt ? new Date(latestScrapedAt).toISOString() : null,
      };
    }
    throw error;
  }
}

module.exports = {
  scrapeBusanCafeteriaMenus,
  getBusanCafeteriaMenus,
  syncCafeteriaMenusToSupabase,
};
