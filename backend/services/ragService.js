const supabase = require("../supabaseClient");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Embeddings run through OpenRouter, not Gemini.
 *
 * They used to be Gemini-only with no fallback, which meant one provider was a
 * single point of failure for the entire knowledge base. On 2026-08-19 that
 * Google project was blocked account-wide — every model, generation included,
 * returned 403 "Your project has been denied access" — and retrieval silently
 * returned nothing for every question. The assistant kept answering fluently
 * from general knowledge, and told a student they could work "up to 20 hours
 * per week" when the guide this app ships says the limit is tiered 10/25/30-35
 * depending on TOPIK level and year.
 *
 * OpenRouter already holds the chat key, so this removes a dependency rather
 * than adding one.
 *
 * The dimension is not a detail. kb_chunk.embedding is vector(768) and every
 * stored vector must come from the same model as the query vector, or cosine
 * similarity compares two unrelated spaces and returns confident nonsense —
 * worse than returning nothing. text-embedding-3-small is natively 1536, so
 * `dimensions` is required, and changing EMBEDDING_MODEL means re-embedding
 * every document: node scripts/embed-kb-documents.js --all
 */
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "openai/text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 768;
const EMBEDDING_TIMEOUT_MS = 15_000;

function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function isEmbeddingConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

async function generateEmbedding(text) {
  const isPlaceholder = !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || process.env.SUPABASE_URL.includes("placeholder");

  if (!isEmbeddingConfigured()) {
    if (isPlaceholder) {
      const dummy = new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() * 0.1);
      return dummy;
    }
    throw new Error("OPENROUTER_API_KEY is required for embeddings");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMBEDDING_TIMEOUT_MS);

  let response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://localhost:3000",
        "X-Title": "Hey! PNU",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });
  } catch (err) {
    throw new Error(
      err.name === "AbortError"
        ? `Embedding request timed out after ${EMBEDDING_TIMEOUT_MS}ms`
        : `Embedding request failed: ${err.message}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Embedding API error: HTTP ${response.status} ${response.statusText}${detail ? ` — ${detail.slice(0, 200)}` : ""}`,
    );
  }

  const data = await response.json();
  const vector = data.data?.[0]?.embedding;
  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Invalid embedding: expected ${EMBEDDING_DIMENSIONS} dimensions, got ${Array.isArray(vector) ? vector.length : typeof vector}. ` +
        `Storing a differently-sized vector would break every future similarity search.`,
    );
  }

  return vector;
}

function chunkText(text, maxLength = 800, overlap = 150) {
  if (!text) return [];
  const paragraphs = text.split("\n");
  const chunks = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if ((currentChunk + "\n" + paragraph).length <= maxLength) {
      currentChunk = currentChunk ? currentChunk + "\n" + paragraph : paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      const overlapStart = Math.max(0, currentChunk.length - overlap);
      currentChunk = currentChunk.substring(overlapStart) + "\n" + paragraph;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

async function syncDocument(docId) {
  const { data: doc, error } = await supabase
    .from("kb_document")
    .select("*")
    .eq("id", docId)
    .single();
  if (error) throw new Error(`Failed to fetch document to sync: ${error.message}`);
  if (!doc) throw new Error(`Document with ID ${docId} not found.`);

  const chunks = chunkText(doc.content);
  const chunkRecords = [];
  for (const text of chunks) {
    const embedding = await generateEmbedding(text);
    chunkRecords.push({
      document_id: doc.id,
      chunk_text: text,
      embedding,
    });
  }

  const { error: deleteError } = await supabase
    .from("kb_chunk")
    .delete()
    .eq("document_id", doc.id);
  if (deleteError) throw new Error(`Failed to delete old chunks: ${deleteError.message}`);

  const { error: insertError } = await supabase.from("kb_chunk").insert(chunkRecords);
  if (insertError) throw new Error(`Failed to save new chunks: ${insertError.message}`);

  return { success: true, chunksCount: chunks.length };
}

/**
 * Cosine-similarity floor for a chunk to count as relevant.
 *
 * Re-measured 2026-08-20 after embeddings moved from Gemini to
 * openai/text-embedding-3-small. This value is model-specific and does NOT
 * carry over: the previous 0.65 was correct for Gemini, whose on-topic scores
 * sat at 0.73-0.86, and left at 0.65 it rejected every single query against
 * the new vectors — "how many hours can I work part time?" retrieves the right
 * document at 0.5457, so retrieval looked completely dead while working
 * perfectly. Changing EMBEDDING_MODEL means re-measuring this.
 *
 * Measured over 12 questions the knowledge base covers and 8 it does not:
 *
 *   on-topic   0.3762 - 0.6916
 *   off-topic  0.1372 - 0.2616
 *
 * 0.32 sits in the empty band, roughly centred, with ~0.06 of margin on each
 * side.
 *
 * It is deliberately NOT lower, even though that would catch more. Korean and
 * Burmese questions land in the 0.10-0.29 range against these English-language
 * documents, and they land on the WRONG ones — "아르바이트 몇 시간까지 할 수
 * 있나요?" (how many hours can I work part-time) scores 0.2920 against the
 * library seat-reservation guide, while the Korean greeting "안녕하세요" scores
 * 0.2834. A greeting outscoring a real question is the signal that this model
 * does not align those languages with English source text, so lowering the
 * floor to reach them would attach confident citations to unrelated documents
 * for exactly the students least able to notice. Chinese does align
 * (0.4063, correct document).
 *
 * The consequence is honest but real: non-English questions mostly return no
 * grounding and get the "general guidance" caution. Fixing that needs
 * translated knowledge-base text, not a smaller number here.
 */
const MATCH_THRESHOLD = Number(process.env.RAG_MATCH_THRESHOLD || 0.32);

/**
 * Same retrieval as retrieveContext, but also returns which documents matched.
 *
 * The chat stream uses the source list to offer follow-up prompts that are
 * grounded in documents actually in the knowledge base, rather than inviting
 * the student to ask something we have no material for.
 *
 * @returns {Promise<{context: string, sources: Array<{title: string, category: string}>}>}
 */
async function retrieveContextWithSources(queryText, filters = {}, limit = 3) {
  const empty = { context: "", sources: [] };

  let queryEmbedding;
  try {
    queryEmbedding = await generateEmbedding(queryText);
  } catch (embeddingErr) {
    console.warn("Embedding generation failed; RAG context retrieval skipped:", embeddingErr.message);
    return empty;
  }

  const { data, error } = await supabase.rpc("match_kb_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: MATCH_THRESHOLD,
    match_count: limit,
    filter_category: filters.category || null,
    filter_country: filters.country || "ALL",
    filter_gender: filters.gender || "ALL",
  });

  if (error) {
    console.error("Vector RPC match failed:", error.message);
    return empty;
  }

  const results = data || [];
  if (results.length === 0) return empty;

  const context = results
    .map(
      (r, index) =>
        `[Source #${index + 1}: ${r.title} (${r.category})]\n${r.chunk_text}`,
    )
    .join("\n\n");

  // De-duplicate by title: several chunks of one document routinely match.
  const seen = new Set();
  const sources = [];
  for (const r of results) {
    const title = String(r.title ?? "").trim();
    if (!title || seen.has(title)) continue;
    seen.add(title);
    sources.push({ title, category: String(r.category ?? "").trim() });
  }

  return { context, sources };
}

async function retrieveContext(queryText, filters = {}, limit = 3) {
  const { context } = await retrieveContextWithSources(queryText, filters, limit);
  return context;
}

module.exports = {
  generateEmbedding,
  chunkText,
  syncDocument,
  retrieveContext,
  retrieveContextWithSources,
  isGeminiConfigured,
  isEmbeddingConfigured,
};
