const supabase = require("../supabaseClient");
const localDb = require("../localDb");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Check if Gemini is configured
function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Generate embedding vector using Gemini text-embedding-004
async function generateEmbedding(text) {
  if (!isGeminiConfigured()) {
    // Return a dummy 768-dim vector for testing/local offline mode
    const dummy = new Array(768).fill(0).map(() => Math.random() * 0.1);
    return dummy;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GEMINI_API_KEY}`;
  const payload = {
    content: {
      parts: [{ text }]
    },
    outputDimensionality: 768
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
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

// Intelligent text chunking
function chunkText(text, maxLength = 800, overlap = 150) {
  if (!text) return [];
  const paragraphs = text.split("\n");
  const chunks = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if ((currentChunk + "\n" + paragraph).length <= maxLength) {
      currentChunk = currentChunk ? (currentChunk + "\n" + paragraph) : paragraph;
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

// Javascript Cosine Similarity helper
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0.0 || normB === 0.0) return 0.0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Sync document text chunks and generate embeddings
async function syncDocument(docId) {
  const isPlaceholder = !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || process.env.SUPABASE_URL.includes("placeholder");

  let doc;
  if (isPlaceholder) {
    doc = localDb.findOne("kb_documents", (d) => Number(d.id) === Number(docId));
  } else {
    const { data, error } = await supabase.from("kb_document").select("*").eq("id", docId).single();
    if (error) throw new Error(`Failed to fetch document to sync: ${error.message}`);
    doc = data;
  }

  if (!doc) throw new Error(`Document with ID ${docId} not found.`);

  // Generate chunks
  const chunks = chunkText(doc.content);

  // Generate embeddings for chunks
  const chunkRecords = [];
  for (const text of chunks) {
    const embedding = await generateEmbedding(text);
    chunkRecords.push({
      document_id: doc.id,
      chunk_text: text,
      embedding
    });
  }

  if (isPlaceholder) {
    // Delete existing chunks
    const allChunks = localDb.get("kb_chunks");
    const remaining = allChunks.filter((c) => Number(c.document_id) !== Number(doc.id));
    localDb.save("kb_chunks", remaining);

    // Save new chunks
    for (const record of chunkRecords) {
      localDb.insert("kb_chunks", record);
    }
  } else {
    // Delete existing chunks
    const { error: deleteError } = await supabase.from("kb_chunk").delete().eq("document_id", doc.id);
    if (deleteError) throw new Error(`Failed to delete old chunks: ${deleteError.message}`);

    // Insert new chunks
    const { error: insertError } = await supabase.from("kb_chunk").insert(chunkRecords);
    if (insertError) throw new Error(`Failed to save new chunks: ${insertError.message}`);
  }

  return { success: true, chunksCount: chunks.length };
}

// Retrieve relevant context chunks matching query and student parameters
async function retrieveContext(queryText, filters = {}, limit = 3) {
  const isPlaceholder = !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || process.env.SUPABASE_URL.includes("placeholder");
  const queryEmbedding = await generateEmbedding(queryText);

  let results = [];
  if (isPlaceholder) {
    const chunks = localDb.get("kb_chunks");
    const docs = localDb.get("kb_documents");

    results = chunks.map((c) => {
      const doc = docs.find((d) => Number(d.id) === Number(c.document_id)) || {};
      const similarity = cosineSimilarity(c.embedding, queryEmbedding);
      return {
        chunk_text: c.chunk_text,
        title: doc.title,
        category: doc.category,
        target_country: doc.target_country || 'ALL',
        target_gender: doc.target_gender || 'ALL',
        similarity
      };
    });

    // Apply filtering
    const filterCountry = filters.country || 'ALL';
    const filterGender = filters.gender || 'ALL';
    const filterCategory = filters.category || null;

    results = results.filter((r) => {
      if (filterCategory && r.category !== filterCategory) return false;
      if (filterCountry !== 'ALL' && r.target_country !== 'ALL' && r.target_country !== filterCountry) return false;
      if (filterGender !== 'ALL' && r.target_gender !== 'ALL' && r.target_gender !== filterGender) return false;
      return r.similarity > 0.45; // Match threshold
    });

    results.sort((a, b) => b.similarity - a.similarity);
    results = results.slice(0, limit);
  } else {
    const { data, error } = await supabase.rpc("match_kb_chunks", {
      query_embedding: queryEmbedding,
      match_threshold: 0.45,
      match_count: limit,
      filter_category: filters.category || null,
      filter_country: filters.country || 'ALL',
      filter_gender: filters.gender || 'ALL'
    });

    if (error) {
      console.error("Vector RPC match failed:", error.message);
      return "";
    }
    results = data || [];
  }

  if (results.length === 0) return "";

  // Format into a grounded context string
  return results.map((r, index) => {
    return `[Source #${index + 1}: ${r.title} (${r.category})]\n${r.chunk_text}`;
  }).join("\n\n");
}

module.exports = {
  isGeminiConfigured,
  generateEmbedding,
  chunkText,
  syncDocument,
  retrieveContext
};
