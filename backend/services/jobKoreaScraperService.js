const JOB_KOREA_BASE_URL = 'https://www.jobkorea.co.kr';
const JOB_KOREA_THEME_URL = `${JOB_KOREA_BASE_URL}/theme/entry-level-internship`;
const JOB_KOREA_LIST_URL = `${JOB_KOREA_BASE_URL}/Theme/TemplateFreeGnoList/entry-level-internship`;
const JOB_KOREA_PAGE_SIZE = 20;
const CACHE_TTL_MS = 1000 * 60 * 5;

const DEFAULT_LIST_QUERY =
  'themeNo=169&tabNo=0&giDisplayCntLimitStat=0&GIOpenTypeCode=0&IsPartCodeSearch=false&MainPageNo=1';

const pageCache = new Map();

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&middot;/gi, '·')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtmlTags(value) {
  return normalizeWhitespace(decodeHtmlEntities(value).replace(/<[^>]+>/g, ' '));
}

function slugify(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toAbsoluteUrl(path) {
  if (!path) return JOB_KOREA_THEME_URL;
  const decodedPath = decodeHtmlEntities(path);
  if (decodedPath.startsWith('http://') || decodedPath.startsWith('https://')) return decodedPath;
  return `${JOB_KOREA_BASE_URL}${decodedPath.startsWith('/') ? decodedPath : `/${decodedPath}`}`;
}

function extractFirstMatch(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1] : null;
}

function extractApplicationType(rInfoHtml) {
  if (/button-apply[\s\S]*?<span>\s*즉시지원\s*<\/span>/i.test(rInfoHtml)) {
    return '즉시지원';
  }

  if (/button-homepage[\s\S]*?<span>\s*홈페이지\s*<\/span>/i.test(rInfoHtml)) {
    return '홈페이지';
  }

  return null;
}

function extractDeadline(rInfoHtml) {
  const periodHtml = extractFirstMatch(rInfoHtml, /<span class="rPeriod">([\s\S]*?)<\/span>/i);
  if (!periodHtml) return null;

  const cleaned = stripHtmlTags(periodHtml);
  const deadlineMatch = cleaned.match(/~\d{2}\/\d{2}\([^)]+\)/);
  return deadlineMatch ? deadlineMatch[0] : cleaned || null;
}

function parseOpportunityItem(itemHtml, index) {
  const company = stripHtmlTags(
    extractFirstMatch(itemHtml, /<a[^>]*class="corNm"[^>]*>([\s\S]*?)<\/a>/i),
  )
    .replace(/슈퍼기업관/g, '')
    .trim();
  const title = stripHtmlTags(
    extractFirstMatch(itemHtml, /<p class="rTit">\s*<a[^>]*>([\s\S]*?)<\/a>/i),
  );
  const detailPath = extractFirstMatch(
    itemHtml,
    /<p class="rTit">\s*<a[^>]*href="([^"]+)"/i,
  );
  const rInfoHtml = extractFirstMatch(itemHtml, /<p class="rInfo">([\s\S]*?)<\/p>/i) || '';
  const role = stripHtmlTags(extractFirstMatch(rInfoHtml, /<span class="rPart">([\s\S]*?)<\/span>/i));
  const deadline = extractDeadline(rInfoHtml);
  const applicationType = extractApplicationType(rInfoHtml);
  const recruitNo = extractFirstMatch(itemHtml, /"recruitNo"\s*:\s*(\d+)/i);

  if (!company || !title) {
    return null;
  }

  const idBase = recruitNo || `${slugify(company)}-${slugify(title)}` || `opportunity-${index + 1}`;

  return {
    id: String(idBase),
    source: 'jobkorea',
    company,
    title,
    deadline,
    role: role || null,
    applicationType,
    sourceUrl: toAbsoluteUrl(detailPath),
  };
}

function parseOpportunitiesFromHtml(html) {
  const itemMatches = html.match(/<li class="dmpItem"[\s\S]*?<\/li>/gi) || [];

  return itemMatches
    .map((itemHtml, index) => parseOpportunityItem(itemHtml, index))
    .filter(Boolean);
}

function parseTotalItems(html) {
  const match = html.match(/data-totalcount="(\d+)"/i);
  if (!match) return null;

  const totalItems = Number(match[1]);
  return Number.isInteger(totalItems) && totalItems >= 0 ? totalItems : null;
}

async function fetchJobKoreaHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      Referer: JOB_KOREA_THEME_URL,
    },
  });

  if (!response.ok) {
    const err = new Error(`Failed to fetch JobKorea page (${response.status})`);
    err.statusCode = 502;
    throw err;
  }

  return response.text();
}

async function fetchJobKoreaListPage(freePageNo) {
  const now = Date.now();
  const cached = pageCache.get(freePageNo);

  if (cached && cached.expiresAt > now) {
    return cached;
  }

  const url = `${JOB_KOREA_LIST_URL}?${DEFAULT_LIST_QUERY}&FreePageNo=${freePageNo}`;
  const html = await fetchJobKoreaHtml(url);
  const opportunities = parseOpportunitiesFromHtml(html);

  if (!opportunities.length) {
    const err = new Error('Unable to parse JobKorea opportunities from scraped page');
    err.statusCode = 502;
    throw err;
  }

  const payload = {
    expiresAt: now + CACHE_TTL_MS,
    opportunities,
    totalItems: parseTotalItems(html) ?? opportunities.length,
  };

  pageCache.set(freePageNo, payload);
  return payload;
}

function summarizeCareers(opportunities = []) {
  const counts = new Map();

  opportunities.forEach((item) => {
    if (!item.role) return;
    counts.set(item.role, (counts.get(item.role) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));
}

async function getCareerOpportunitiesPage({ page = 1, limit = 10 }) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;

  const globalStart = (safePage - 1) * safeLimit;
  const firstJobKoreaPage = Math.floor(globalStart / JOB_KOREA_PAGE_SIZE) + 1;
  const offsetInFirstPage = globalStart % JOB_KOREA_PAGE_SIZE;

  const firstPayload = await fetchJobKoreaListPage(firstJobKoreaPage);
  const totalItems = firstPayload.totalItems;

  let opportunities = firstPayload.opportunities.slice(
    offsetInFirstPage,
    offsetInFirstPage + safeLimit,
  );

  if (opportunities.length < safeLimit) {
    const secondPayload = await fetchJobKoreaListPage(firstJobKoreaPage + 1);
    const remaining = safeLimit - opportunities.length;
    opportunities = opportunities.concat(secondPayload.opportunities.slice(0, remaining));
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / safeLimit));
  const boundedPage = Math.min(safePage, totalPages);

  const careersSource = await fetchJobKoreaListPage(1);

  return {
    source: JOB_KOREA_THEME_URL,
    careers: summarizeCareers(careersSource.opportunities),
    opportunities,
    pagination: {
      page: boundedPage,
      limit: safeLimit,
      totalItems,
      totalPages,
      hasNextPage: boundedPage < totalPages,
      hasPrevPage: boundedPage > 1,
    },
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = {
  getCareerOpportunitiesPage,
};
