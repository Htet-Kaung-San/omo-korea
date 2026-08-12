const cheerio = require("cheerio");
const { upsertCareerOpportunities } = require("./careerOpportunityRepository");

const VOLUNTEER_1365_BASE_URL = "https://www.1365.go.kr";
const VOLUNTEER_1365_LIST_PATH = "/vols/1572247904127/partcptn/timeCptn.do";
const VOLUNTEER_1365_LIST_URL = `${VOLUNTEER_1365_BASE_URL}${VOLUNTEER_1365_LIST_PATH}`;
const VOLUNTEER_1365_REGION_BUSAN = "6260000";
const DEFAULT_MAX_PAGES = 120;

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function dotDateToIso(value) {
  const match = normalizeWhitespace(value).match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function parseDateRange(value) {
  const matches = [...normalizeWhitespace(value).matchAll(/(\d{4}\.\d{2}\.\d{2})/g)]
    .map((match) => dotDateToIso(match[1]))
    .filter(Boolean);

  return {
    start: matches[0] || null,
    end: matches[1] || null,
  };
}

function getFieldText($, $item, label) {
  const $label = $item
    .find("p")
    .filter((_, element) => normalizeWhitespace($(element).text()) === label)
    .first();

  if (!$label.length) return "";
  return normalizeWhitespace($label.siblings("span").first().text());
}

function buildSourceUrl(externalId) {
  return `${VOLUNTEER_1365_LIST_URL}?type=show&progrmRegistNo=${encodeURIComponent(externalId)}`;
}

function parse1365VolunteerOpportunities(html, { minDeadline = null } = {}) {
  const $ = cheerio.load(html);
  const opportunities = [];
  const deadlines = [];

  $("ul.list_wrap > li").each((_, element) => {
    const $item = $(element);
    const externalId = $item.find('input[name="progrmRegistNo"]').first().attr("value");
    const title = normalizeWhitespace($item.find(".tit_board_list").first().text());
    const company = normalizeWhitespace($item.find(".vols-location div").eq(1).text());
    const location = normalizeWhitespace($item.find(".vols-location div").eq(0).text());
    const status = normalizeWhitespace($item.find(".close_dDay .end").first().text());
    const deadlineBadge = normalizeWhitespace($item.find(".close_dDay .tit").first().text());
    const role = $item
      .find(".ing li")
      .map((_, tag) => normalizeWhitespace($(tag).text()))
      .get()
      .filter(Boolean)
      .join(" / ");

    const volunteerPeriodText = getFieldText($, $item, "봉사기간");
    const volunteerTime = getFieldText($, $item, "봉사시간");
    const recruitmentPeriodText = getFieldText($, $item, "모집기간");
    const recognizedTime = getFieldText($, $item, "인정시간");
    const volunteerPeriod = parseDateRange(volunteerPeriodText);
    const recruitmentPeriod = parseDateRange(recruitmentPeriodText);
    const deadline = recruitmentPeriod.end;

    if (deadline) deadlines.push(deadline);
    if (!externalId || !title || !company || !deadline) return;
    if (minDeadline && deadline <= minDeadline) return;

    opportunities.push({
      source: "1365",
      externalId,
      company,
      title,
      deadline,
      role: role || "시간인증 / 봉사",
      applicationType: status || "모집중",
      sourceUrl: buildSourceUrl(externalId),
      location,
      jobType: "volunteer",
      language: "ko",
      scrapedAt: new Date().toISOString(),
      rawData: {
        deadlineBadge,
        status,
        volunteerPeriod,
        recruitmentPeriod,
        volunteerTime,
        recognizedTime,
      },
    });
  });

  return { opportunities, deadlines };
}

async function fetch1365VolunteerListPage({
  page = 1,
  fromDate = new Date(),
  toDate = addMonths(new Date(), 4),
} = {}) {
  const body = new URLSearchParams({
    cPage: String(page),
    searchFlag: "search",
    requstSe: "Y",
    reqConfirm: "N",
    firstSearch: "",
    hopea1: VOLUNTEER_1365_REGION_BUSAN,
    hopea2: "",
    flag: "A01",
    listType: "",
    searchRcognSrvcTime: "",
    searchHopeArea1: VOLUNTEER_1365_REGION_BUSAN,
    searchHopeSrvc1: "",
    searchActOnline: "",
    searchSrvcTarget: "",
    searchSrvcStts: "0",
    searchProgrmBgnde: formatDate(fromDate),
    searchProgrmEndde: formatDate(toDate),
    adultPosblAt: "Y",
    yngbgsPosblAt: "Y",
    searchWeek: "0",
    searchKeyword: "",
    searchNanmmbyNm: "",
  });

  const response = await fetch(VOLUNTEER_1365_LIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: VOLUNTEER_1365_LIST_URL,
    },
    body,
  });

  if (!response.ok) {
    const err = new Error(`Failed to fetch 1365 volunteer page (${response.status})`);
    err.statusCode = 502;
    throw err;
  }

  return response.text();
}

/**
 * Scrapes all Busan volunteer opportunities whose recruitment deadline is
 * later than `minDeadline` (default: later than the next day). Stops at the
 * end of the result list or `maxPages`.
 */
async function scrape1365VolunteerOpportunities({
  minDeadline,
  maxPages = DEFAULT_MAX_PAGES,
  fromDate = new Date(),
  toDate = addMonths(new Date(), 4),
} = {}) {
  const effectiveMinDeadline = minDeadline || formatDate(addDays(new Date(), 1));
  const all = [];
  let pagesScanned = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const html = await fetch1365VolunteerListPage({ page, fromDate, toDate });
    const { opportunities, deadlines } = parse1365VolunteerOpportunities(html, {
      minDeadline: effectiveMinDeadline,
    });

    pagesScanned = page;
    all.push(...opportunities);

    if (deadlines.length === 0) break;
  }

  return {
    source: VOLUNTEER_1365_LIST_URL,
    minDeadline: effectiveMinDeadline,
    pagesScanned,
    opportunities: all,
    scrapedAt: new Date().toISOString(),
  };
}

async function sync1365VolunteerOpportunities(options = {}) {
  const minDeadline = options.minDeadline || formatDate(addDays(new Date(), 1));
  const scrapeResult = await scrape1365VolunteerOpportunities({
    ...options,
    minDeadline,
  });
  const upsertResult = await upsertCareerOpportunities(scrapeResult.opportunities);

  return {
    ...scrapeResult,
    upserted: upsertResult.count,
  };
}

module.exports = {
  VOLUNTEER_1365_LIST_URL,
  VOLUNTEER_1365_REGION_BUSAN,
  fetch1365VolunteerListPage,
  parse1365VolunteerOpportunities,
  scrape1365VolunteerOpportunities,
  sync1365VolunteerOpportunities,
};
