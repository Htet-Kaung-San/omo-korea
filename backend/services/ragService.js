const supabase = require("../supabaseClient");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function generateEmbedding(text) {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY is required for embeddings");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GEMINI_API_KEY}`;
  const payload = {
    content: {
      parts: [{ text }],
    },
    outputDimensionality: 768,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Gemini Embedding API error: ${response.statusText}`);
  }

  const data = await response.json();
  const vector = data.embedding?.values;
  if (!vector || vector.length !== 768) {
    throw new Error("Invalid embedding vector returned from Gemini");
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

async function retrieveContext(queryText, filters = {}, limit = 3) {
  const queryEmbedding = await generateEmbedding(queryText);

  const { data, error } = await supabase.rpc("match_kb_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: 0.45,
    match_count: limit,
    filter_category: filters.category || null,
    filter_country: filters.country || "ALL",
    filter_gender: filters.gender || "ALL",
  });

  if (error) {
    console.error("Vector RPC match failed:", error.message);
    return "";
  }

  const results = data || [];
  if (results.length === 0) return "";

  return results
    .map(
      (r, index) =>
        `[Source #${index + 1}: ${r.title} (${r.category})]\n${r.chunk_text}`,
    )
    .join("\n\n");
}

module.exports = {
  generateEmbedding,
  chunkText,
  syncDocument,
  retrieveContext,
  isGeminiConfigured,
};
