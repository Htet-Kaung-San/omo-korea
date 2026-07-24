/**
 * Embed knowledge-base documents into kb_chunk so RAG can retrieve them.
 *
 * By default only embeds documents that currently have NO chunks (idempotent,
 * safe to re-run). Pass --all to re-embed every document from scratch.
 *
 *   node scripts/embed-kb-documents.js          # only the missing ones
 *   node scripts/embed-kb-documents.js --all     # re-embed everything
 *
 * Requires GEMINI_API_KEY (embeddings) and SUPABASE_URL / SUPABASE_KEY.
 */
require("dotenv").config();
const supabase = require("../supabaseClient");
const ragService = require("../services/ragService");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const embedAll = process.argv.includes("--all");

  if (!ragService.isGeminiConfigured()) {
    console.error("✗ GEMINI_API_KEY is not set — embeddings require it. Aborting.");
    process.exit(1);
  }

  const { data: docs, error: docErr } = await supabase
    .from("kb_document")
    .select("id, title")
    .order("id", { ascending: true });
  if (docErr) {
    console.error("✗ Failed to load kb_document:", docErr.message);
    process.exit(1);
  }

  const { data: chunks, error: chunkErr } = await supabase
    .from("kb_chunk")
    .select("document_id");
  if (chunkErr) {
    console.error("✗ Failed to load kb_chunk:", chunkErr.message);
    process.exit(1);
  }

  const embedded = new Set((chunks || []).map((c) => c.document_id));
  const targets = embedAll ? docs : (docs || []).filter((d) => !embedded.has(d.id));

  if (!targets.length) {
    console.log("✓ Nothing to embed — every document already has chunks.");
    return;
  }

  console.log(`Embedding ${targets.length} document(s)${embedAll ? " (--all)" : " (missing only)"}...\n`);

  let ok = 0;
  const failures = [];
  for (const doc of targets) {
    try {
      const { chunksCount } = await ragService.syncDocument(doc.id);
      ok += 1;
      console.log(`  ✓ id=${doc.id}  ${chunksCount} chunk(s)  — ${doc.title}`);
    } catch (err) {
      failures.push({ id: doc.id, title: doc.title, error: err.message });
      console.error(`  ✗ id=${doc.id}  FAILED — ${doc.title}\n      ${err.message}`);
    }
    await sleep(400); // stay gentle on the Gemini embedding rate limit
  }

  console.log(`\nDone. Embedded ${ok}/${targets.length}.`);
  if (failures.length) {
    console.log(`Failed (${failures.length}): ${failures.map((f) => f.id).join(", ")}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
