/**
 * Ingest the frontend guide content into the RAG knowledge base.
 *
 * The work-permit, one-stop and library guides already hold written, reviewed
 * content — but only inside the frontend i18n bundles, where the chatbot cannot
 * see it. The knowledge base currently has no document about visas, part-time
 * work, or campus services at all, so `match_kb_chunks` returns nothing for the
 * questions students ask most and the assistant falls back to general world
 * knowledge. This script turns that existing content into kb_document rows.
 *
 *   node scripts/ingest-guide-docs.mjs --dry-run   # preview, writes nothing
 *   node scripts/ingest-guide-docs.mjs             # upsert documents
 *   node scripts/ingest-guide-docs.mjs --embed     # upsert, then embed
 *
 * Idempotent: documents are matched on title, so re-running updates in place
 * rather than duplicating. Requires SUPABASE_URL / SUPABASE_KEY, and
 * GEMINI_API_KEY when --embed is passed.
 *
 * Source of truth stays the frontend i18n files — re-run this after editing a
 * guide so the knowledge base does not drift from what the app displays.
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
require("dotenv").config();

const supabase = require("../supabaseClient");
const ragService = require("../services/ragService");

const backendRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const i18nRoot = path.join(backendRoot, "..", "frontend", "src", "i18n");

const GUIDES = [
  {
    dir: "workPermitGuide",
    category: "Work & Visa",
    label: "Part-Time Work Permit",
  },
  {
    dir: "oneStop",
    category: "Campus Services",
    label: "One-Stop Service Centre",
  },
  {
    dir: "libraryGuide",
    category: "Library",
    label: "Library",
  },
];

const DRY_RUN = process.argv.includes("--dry-run");
const EMBED = process.argv.includes("--embed");
const SHOW = process.argv.includes("--show")
  ? process.argv[process.argv.indexOf("--show") + 1]
  : null;

/** Markdown renders in the UI but only adds noise to an embedding. */
function toPlainText(value) {
  return String(value ?? "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)") // keep link text AND url
    .replace(/\*\*/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

async function loadGuide(dir) {
  // Node strips TypeScript types natively, so the frontend modules load as-is.
  const sections = await import(path.join(i18nRoot, dir, "sections.ts"));
  const messages = await import(path.join(i18nRoot, dir, "messages", "en.ts"));
  const defs = Object.values(sections).find(Array.isArray);
  if (!defs) throw new Error(`No section definitions exported from ${dir}/sections.ts`);
  return { defs, messages: messages.default };
}

const HOURS_TABLE_COMPONENT = path.join(
  backendRoot,
  "..",
  "frontend",
  "src",
  "components",
  "guide",
  "WorkPermitHoursTable.tsx",
);

/**
 * The work-hour limits live in a React component as a module-local const, so
 * they cannot be imported. Parse them out of the source instead of restating
 * them here — a second copy of immigration hour limits would eventually drift,
 * and telling a student the wrong number is a legal problem, not a UI bug.
 * Throws rather than returning nothing, so a refactor surfaces loudly.
 */
async function loadHourBlocks() {
  const source = await readFile(HOURS_TABLE_COMPONENT, "utf8");
  const arrayMatch = source.match(/const HOUR_BLOCKS[^=]*=\s*\[([\s\S]*?)\n\]/);
  if (!arrayMatch) {
    throw new Error(
      `Could not locate HOUR_BLOCKS in ${path.relative(backendRoot, HOURS_TABLE_COMPONENT)} — ` +
        `the component was refactored. Update loadHourBlocks() before re-running; ` +
        `silently omitting the work-hour limits is not acceptable.`,
    );
  }

  const blocks = [...arrayMatch[1].matchAll(/\{([^}]*)\}/g)].map((m) => {
    const fields = {};
    for (const [, key, value] of m[1].matchAll(/(\w+):\s*'([^']*)'/g)) {
      fields[key] = value;
    }
    return fields;
  });

  const complete = blocks.filter((b) => b.courseKey && b.notMetHoursKey);
  if (!complete.length) {
    throw new Error(
      `Parsed HOUR_BLOCKS but found no usable rows in ` +
        `${path.relative(backendRoot, HOURS_TABLE_COMPONENT)}. Refusing to emit a ` +
        `work-permit hours document with no hours in it.`,
    );
  }
  return complete;
}

/** Prose reads back better from a vector search than a pipe-delimited grid. */
function renderHourBlocks(blocks, t, missing) {
  const lines = [t("workPermit.hours.table.title", missing)].filter(Boolean);
  const criteriaLabel = t("workPermit.hours.table.colKoreanCriteria", missing);

  for (const b of blocks) {
    const who = [t(b.courseKey, missing), t(b.yearKey, missing)].filter(Boolean).join(", ");
    // The criteria string carries newline-separated alternatives; flatten so the
    // whole rule stays on one retrievable line.
    const criteria = t(b.criteriaKey, missing).replace(/\s*\n\s*/g, " ");
    const notMet = t(b.notMetHoursKey, missing);
    const weekday = t(b.metWeekdayKey, missing);
    const weekend = t(b.metWeekendKey, missing);
    const bonus = t(b.bonusKey, missing);

    lines.push(
      `- ${who}${criteria ? ` (${criteriaLabel}: ${criteria})` : ""}: ` +
        `without meeting the Korean proficiency requirement, ${notMet} per week. ` +
        `Meeting it, ${weekday} on weekdays and ${weekend} on weekends and semester breaks` +
        (bonus ? `; ${bonus} on weekdays at a certified university with excellent grades and Korean.` : "."),
    );
  }
  return lines;
}

function renderTable(table, t, missing) {
  const lines = [];
  if (table.titleKey) lines.push(t(table.titleKey, missing));
  const headers = (table.headerKeys || []).map((k) => t(k, missing)).filter(Boolean);
  if (headers.length) lines.push(headers.join(" | "));
  for (const row of table.rowKeys || []) {
    const cells = row.map((k) => t(k, missing)).filter(Boolean);
    if (cells.length) lines.push(cells.join(" | "));
  }
  return lines;
}

function buildDocument(guide, section, messages, missing, hourBlocks) {
  const t = (key, sink) => {
    const value = messages[key];
    if (value === undefined) {
      sink.push(key);
      return "";
    }
    return toPlainText(value);
  };

  const heading = t(section.titleKey, missing) || section.id;
  const lines = [];

  for (const key of section.bulletKeys || []) {
    const text = t(key, missing);
    if (text) lines.push(`- ${text}`);
  }
  for (const [i, key] of (section.stepKeys || []).entries()) {
    const text = t(key, missing);
    if (text) lines.push(`${i + 1}. ${text}`);
  }
  for (const key of section.usageGuideKeys || []) {
    const text = t(key, missing);
    if (text) lines.push(`- ${text}`);
  }
  if (section.hoursTable) {
    lines.push(...renderHourBlocks(hourBlocks, t, missing));
  }
  for (const table of section.tables || []) {
    lines.push(...renderTable(table, t, missing));
  }
  if (section.noteKey) {
    const note = t(section.noteKey, missing);
    if (note) lines.push(`Note: ${note}`);
  }
  for (const link of section.relatedPages || []) {
    const label = t(link.labelKey, missing);
    if (label) lines.push(`Related: ${label} (${link.href})`);
  }

  if (!lines.length) return null;

  return {
    title: `${guide.label} — ${heading}`,
    category: guide.category,
    // Lead with the heading so the embedding carries the topic, not just detail.
    content: [`${guide.label}: ${heading}`, "", ...lines].join("\n"),
    target_country: "ALL",
    target_gender: "ALL",
  };
}

async function upsert(doc) {
  const { data: existing, error: findErr } = await supabase
    .from("kb_document")
    .select("id")
    .eq("title", doc.title)
    .maybeSingle();
  if (findErr) throw new Error(`lookup failed: ${findErr.message}`);

  if (existing) {
    const { error } = await supabase
      .from("kb_document")
      .update({ ...doc, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw new Error(`update failed: ${error.message}`);
    return { id: existing.id, action: "updated" };
  }

  const { data, error } = await supabase
    .from("kb_document")
    .insert(doc)
    .select("id")
    .single();
  if (error) throw new Error(`insert failed: ${error.message}`);
  return { id: data.id, action: "inserted" };
}

async function main() {
  const documents = [];
  const missing = [];
  const hourBlocks = await loadHourBlocks();
  console.log(`Parsed ${hourBlocks.length} work-hour row(s) from WorkPermitHoursTable.tsx.`);

  for (const guide of GUIDES) {
    const { defs, messages } = await loadGuide(guide.dir);
    for (const section of defs) {
      const doc = buildDocument(guide, section, messages, missing, hourBlocks);
      if (doc) documents.push(doc);
      else console.warn(`  ! ${guide.dir}/${section.id} produced no content — skipped`);
    }
  }

  console.log(`Built ${documents.length} document(s) from ${GUIDES.length} guides.\n`);
  for (const doc of documents) {
    console.log(`  [${doc.category}] ${doc.title}  (${doc.content.length} chars)`);
  }

  if (missing.length) {
    const unique = [...new Set(missing)];
    console.warn(`\n! ${unique.length} message key(s) referenced but absent from en.ts:`);
    unique.slice(0, 10).forEach((k) => console.warn(`    ${k}`));
  }

  if (SHOW) {
    const matches = documents.filter((d) =>
      d.title.toLowerCase().includes(SHOW.toLowerCase()),
    );
    console.log(`\n--- ${matches.length} document(s) matching "${SHOW}" ---`);
    for (const doc of matches) {
      console.log(`\n=== ${doc.title} [${doc.category}] ===\n${doc.content}`);
    }
  }

  if (DRY_RUN) {
    console.log("\n--dry-run: nothing written.");
    if (!SHOW) {
      console.log("\n--- sample document ---");
      console.log(documents[0]?.content);
      console.log('\n(use --show "<title substring>" to inspect a specific document)');
    }
    return;
  }

  console.log("\nWriting to kb_document...");
  const written = [];
  for (const doc of documents) {
    const { id, action } = await upsert(doc);
    written.push(id);
    console.log(`  ${action === "inserted" ? "+" : "~"} id=${id}  ${doc.title}`);
  }

  if (!EMBED) {
    console.log(
      `\nDone. ${written.length} document(s) written.\n` +
        `Run: node scripts/embed-kb-documents.js   (or re-run with --embed)`,
    );
    return;
  }

  if (!ragService.isGeminiConfigured()) {
    console.error("\n✗ GEMINI_API_KEY is not set — cannot embed. Documents were still written.");
    process.exitCode = 1;
    return;
  }

  console.log("\nEmbedding...");
  let ok = 0;
  for (const id of written) {
    try {
      const { chunksCount } = await ragService.syncDocument(id);
      ok += 1;
      console.log(`  ✓ id=${id}  ${chunksCount} chunk(s)`);
    } catch (err) {
      console.error(`  ✗ id=${id}  ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 400)); // Gemini embedding rate limit
  }
  console.log(`\nDone. ${written.length} document(s), ${ok} embedded.`);
  if (ok !== written.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
