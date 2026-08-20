/**
 * Checks every hardcoded OpenRouter model id against the live catalogue.
 *
 * Slugs are retired without notice. On 2026-08-20 five of ours had gone —
 * meta-llama/llama-3.3-70b-instruct:free, meta-llama/llama-3.2-3b-instruct:free,
 * google/gemini-1.5-flash, google/gemma-2-9b-it:free and
 * qwen/qwen3-next-80b-a3b-instruct:free — which left cafeteria translation with
 * no working model in its entire fallback chain. Nothing failed loudly: each
 * request 404'd, the code moved to the next model, and the last one failed too,
 * so the feature just stopped translating.
 *
 * Run this before a demo, or whenever a provider path starts misbehaving:
 *
 *   npm run check:models
 *
 * Exits non-zero if any id is missing, so it can gate a deploy.
 */
import 'dotenv/config'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const key = process.env.OPENROUTER_API_KEY
if (!key) {
  console.error('✗ OPENROUTER_API_KEY is not set — cannot check the model list.')
  process.exit(1)
}

// Provider-prefixed ids, e.g. "google/gemini-2.5-flash" or "openrouter/free".
const MODEL_ID = /["']([a-z0-9-]+\/[A-Za-z0-9._:-]+)["']/g
const PROVIDERS = /^(openai|anthropic|google|meta-llama|qwen|mistralai|deepseek|openrouter|x-ai|amazon|cohere)\//

/** Embedding models are served but not listed by /models, so they are checked by calling them. */
const EMBEDDING_IDS = new Set(['openai/text-embedding-3-small', 'openai/text-embedding-3-large'])

function collectIds() {
  const found = new Map() // id -> Set<file>
  const dirs = ['services', 'controllers', 'ai']
  for (const dir of dirs) {
    let entries = []
    try {
      entries = readdirSync(join(backendRoot, dir))
    } catch {
      continue
    }
    for (const name of entries.filter((f) => f.endsWith('.js'))) {
      const file = join(dir, name)
      const source = readFileSync(join(backendRoot, file), 'utf8')
      // Skip comment lines: they name retired slugs on purpose.
      const code = source
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('//') && !line.trimStart().startsWith('*'))
        .join('\n')
      for (const match of code.matchAll(MODEL_ID)) {
        const id = match[1]
        if (!PROVIDERS.test(id)) continue
        if (!found.has(id)) found.set(id, new Set())
        found.get(id).add(file)
      }
    }
  }
  return found
}

/**
 * Models configured by environment rather than written in the source.
 *
 * These are the ones that matter most and the ones a source scan misses. On
 * 2026-08-20 every hardcoded id was live while OPENROUTER_MODEL still pointed
 * at anthropic/claude-3.5-sonnet, so this check passed and every chat request
 * was quietly spending a 404 round-trip before falling back.
 */
const ENV_MODELS = ['OPENROUTER_MODEL', 'EMBEDDING_MODEL', 'BENCHMARK_JUDGE_MODEL']

function collectEnvIds(found) {
  for (const name of ENV_MODELS) {
    const id = process.env[name]
    if (!id || !PROVIDERS.test(id)) continue
    if (!found.has(id)) found.set(id, new Set())
    found.get(id).add(`$${name} (environment)`)
  }
  return found
}

async function main() {
  const found = collectEnvIds(collectIds())
  if (found.size === 0) {
    console.log('No hardcoded model ids found.')
    return
  }

  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!response.ok) {
    console.error(`✗ Could not read OpenRouter's model list: HTTP ${response.status}`)
    process.exit(1)
  }
  const live = new Set(((await response.json()).data || []).map((m) => m.id))
  console.log(`OpenRouter lists ${live.size} models.\n`)

  const missing = []
  for (const [id, files] of [...found].sort()) {
    if (live.has(id)) {
      console.log(`  ✓ ${id}`)
      continue
    }
    if (EMBEDDING_IDS.has(id)) {
      // /models covers chat models only; prove this one by using it.
      const probe = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: id, input: 'probe', dimensions: 768 }),
      })
      if (probe.ok) {
        console.log(`  ✓ ${id}  (embedding endpoint — not in /models, verified by calling it)`)
        continue
      }
      missing.push({ id, files, detail: `embedding probe returned HTTP ${probe.status}` })
      console.log(`  ✗ ${id}  — embedding probe HTTP ${probe.status}`)
      continue
    }
    missing.push({ id, files, detail: 'not in the live catalogue' })
    console.log(`  ✗ ${id}  — ${[...files].join(', ')}`)
  }

  if (missing.length > 0) {
    console.error(`\n${missing.length} model id(s) are no longer available:`)
    for (const m of missing) console.error(`  ${m.id}  (${[...m.files].join(', ')}) — ${m.detail}`)
    console.error('\nA retired slug does not fail loudly: the request 404s, the code falls through')
    console.error('to the next model, and if every one is retired the feature simply stops working.')
    process.exitCode = 1
    return
  }
  console.log('\nAll model ids are live.')
}

main().catch((err) => {
  console.error('✗', err.message)
  process.exit(1)
})
