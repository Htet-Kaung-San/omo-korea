require("dotenv").config();

const {
  sync1365VolunteerOpportunities,
} = require("../services/volunteer1365ScraperService");

function parseArgs(argv) {
  const options = {};

  argv.forEach((arg) => {
    if (arg.startsWith("--after=")) {
      options.minDeadline = arg.slice("--after=".length);
    } else if (arg.startsWith("--max-pages=")) {
      const maxPages = Number(arg.slice("--max-pages=".length));
      if (Number.isInteger(maxPages) && maxPages > 0) {
        options.maxPages = maxPages;
      }
    }
  });

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await sync1365VolunteerOpportunities(options);

  console.log(
    JSON.stringify(
      {
        source: result.source,
        minDeadline: result.minDeadline,
        pagesScanned: result.pagesScanned,
        scraped: result.opportunities.length,
        upserted: result.upserted,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
