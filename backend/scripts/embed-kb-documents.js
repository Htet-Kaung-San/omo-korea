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

  if (!ragService.isEmbeddingConfigured()) {
    console.error("✗ OPENROUTER_API_KEY is not set — embeddings require it. Aborting.");
    process.exit(1);
  }

  // Prove the provider actually answers before touching a single row.
  // syncDocument replaces a document's chunks, so a provider that is reachable
  // at the start and dead by document 20 leaves half the knowledge base in one
  // vector space and half in another. Similarity between two different spaces
  // is meaningless but still returns a number, so retrieval would confidently
  // surface the wrong documents — worse than returning nothing at all.
  try {
    const probe = await ragService.generateEmbedding("preflight");
    console.log(`✓ Embedding provider reachable (${probe.length} dimensions).\n`);
  } catch (err) {
    console.error(`✗ Embedding provider is not answering: ${err.message}`);
    console.error("  Nothing was changed. Fix the provider and re-run.");
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
    await sleep(400); // stay gentle on the embedding rate limit
  }

  console.log(`\nDone. Embedded ${ok}/${targets.length}.`);
  if (failures.length) {
    console.log(`Failed (${failures.length}): ${failures.map((f) => f.id).join(", ")}`);
    if (embedAll) {
      console.log(
        "\n⚠ This was a --all run and some documents did not finish, so the\n" +
          "  knowledge base now mixes vectors from two runs. Re-run until every\n" +
          "  document succeeds — retrieval compares query and stored vectors\n" +
          "  directly, and a mixed set returns plausible but wrong matches.",
      );
    }
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
