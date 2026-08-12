require('dotenv').config();
const { runCafeteriaPreScrape } = require('../services/preScrapeCafeteriaService');

async function main() {
  console.log('--- Hey! PNU Cafeteria Pre-Scraper ---');
  const result = await runCafeteriaPreScrape({ force: true });
  if (result) {
    console.log('Cafeteria menu pre-scraping completed successfully.');
    process.exit(0);
  } else {
    console.error('Cafeteria menu pre-scraping encountered an error.');
    process.exit(1);
  }
}

main();
