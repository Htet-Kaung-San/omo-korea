const { scrapeAndCacheCafeteriaMenus } = require('./pnuCafeteriaMenuScraperService');
const { preTranslateCafeteriaMenus } = require('./geminiService');

let isScrapingInProgress = false;

/**
 * Pre-scrapes PNU cafeteria menus from the official university site,
 * saves them to Supabase DB, and pre-translates them into target languages.
 * This runs in the background so user HTTP requests respond instantly (<20ms).
 */
async function runCafeteriaPreScrape({ force = false, targetLanguages = ['en', 'zh', 'vi', 'ja'] } = {}) {
  if (isScrapingInProgress) {
    console.log('[preScrapeCafeteria] Pre-scrape job already in progress. Skipping.');
    return null;
  }

  isScrapingInProgress = true;
  const startTime = Date.now();
  console.log('[preScrapeCafeteria] Starting background cafeteria menu pre-scrape & pre-translation...');

  try {
    const payload = await scrapeAndCacheCafeteriaMenus({ forceRefresh: force });
    const hallCount = payload?.cafeterias?.length ?? 0;
    console.log(`[preScrapeCafeteria] Scraped ${hallCount} cafeteria hall(s) from PNU website.`);

    if (hallCount > 0) {
      const cacheSalt = `${payload.scraped_at || ''}|${payload.menu_date || 'current'}`;
      await preTranslateCafeteriaMenus(payload.cafeterias, targetLanguages, cacheSalt);
    }

    const elapsed = Date.now() - startTime;
    console.log(`[preScrapeCafeteria] Pre-scrape & translation completed in ${elapsed}ms.`);
    return payload;
  } catch (error) {
    console.warn('[preScrapeCafeteria] Background pre-scrape failed:', error.message);
    return null;
  } finally {
    isScrapingInProgress = false;
  }
}

/**
 * Schedules recurring background pre-scraping.
 * Triggers once 1 second after boot, and again every `intervalMs` (default: 3 hours).
 */
function startCafeteriaPreScrapeSchedule(intervalMs = 1000 * 60 * 60 * 3) {
  setTimeout(() => {
    runCafeteriaPreScrape({ force: false }).catch(() => {});
  }, 1000);

  const timer = setInterval(() => {
    runCafeteriaPreScrape({ force: true }).catch(() => {});
  }, intervalMs);

  if (timer.unref) {
    timer.unref();
  }
}

module.exports = {
  runCafeteriaPreScrape,
  startCafeteriaPreScrapeSchedule,
};
