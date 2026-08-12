/**
 * Benchmark the Hey! PNU assistant against a non-OKF baseline.
 *
 * Two conditions run the SAME model with the SAME system instruction, so the
 * only variable is whether the Open Knowledge Framework supplied retrieved
 * context:
 *
 *   okf       retrieveContext() -> "PNU Knowledge Base Context: ..." + question
 *   baseline  the question alone, no retrieval
 *
 * Each answer is then graded by an LLM judge against facts taken verbatim from
 * the knowledge-base documents, so the score is checkable rather than a
 * matter of taste. Questions marked `not_covered` have no KB answer at all and
 * measure the opposite property: whether the assistant admits the gap instead
 * of inventing PNU-specific detail.
 *
 *   node benchmark/run-benchmark.mjs --dry-run       # plan + cost, no API calls
 *   node benchmark/run-benchmark.mjs --limit 5       # smoke test on 5 questions
 *   node benchmark/run-benchmark.mjs                 # full run
 *   node benchmark/run-benchmark.mjs --conditions okf
 *
 * Writes results/<timestamp>.json (every answer and judgement) and
 * results/<timestamp>.md (the summary table).
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
require("dotenv").config({ quiet: true });

const ragService = require("../services/ragService");
const { generateOpenRouterChat } = require("../services/openrouterService");

const here = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(here, "results");

function flag(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = Number(flag("limit", 0)) || 0;
const CONDITIONS = (flag("conditions", "okf,baseline") || "").split(",").map((s) => s.trim());
// Deliberately a different vendor from the answering chain (which resolves to
// Google Gemini today) so the run is not self-graded.
const JUDGE_MODEL = flag("judge", process.env.BENCHMARK_JUDGE_MODEL || "openai/gpt-4o-mini");
const PAUSE_MS = Number(flag("pause", 700));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ answers */

/**
 * Mirrors how aiController builds the augmented prompt, so the benchmark
 * measures the real product rather than an idealised version of it.
 */
async function answerWithOkf(question) {
  const started = Date.now();
  const context = await ragService.retrieveContext(question);
  let prompt = "";
  if (context) prompt += `PNU Knowledge Base Context:\n${context}\n\n`;
  prompt += `User Question: ${question}`;
  const answer = await generateOpenRouterChat(prompt, []);
  return {
    answer,
    retrieved: Boolean(context),
    sources: context ? [...context.matchAll(/\[Source #\d+: ([^\]]+)\]/g)].map((m) => m[1]) : [],
    ms: Date.now() - started,
  };
}

/** Same model, same system instruction, no retrieved context. */
async function answerWithBaseline(question) {
  const started = Date.now();
  const answer = await generateOpenRouterChat(`User Question: ${question}`, []);
  return { answer, retrieved: false, sources: [], ms: Date.now() - started };
}

const RUNNERS = { okf: answerWithOkf, baseline: answerWithBaseline };

/* -------------------------------------------------------------------- judge */

function buildJudgePrompt(q, answer) {
  const covered = q.coverage === "covered";
  return `You are grading an AI assistant for international students at Pusan National University (PNU). Grade strictly and return JSON only.

QUESTION
${q.question}

KNOWLEDGE-BASE COVERAGE: ${q.coverage}
${covered
      ? `EXPECTED FACTS (taken verbatim from the official knowledge base — the answer should convey these):\n${q.expected.map((e) => `- ${e}`).join("\n")}`
      : `There is NO knowledge-base document covering this. The assistant should admit it lacks PNU-specific information and point to an official source rather than inventing specifics.`}
${q.expected_behaviour ? `\nNOTE ON WHAT A GOOD ANSWER LOOKS LIKE:\n${q.expected_behaviour}` : ""}

ANSWER TO GRADE
${answer}

Return ONLY this JSON object, no prose and no markdown fences:
{
  "correctness": 0 | 1 | 2,
  "specificity": 0 | 1 | 2,
  "hallucination": true | false,
  "gap_handled_well": true | false | null,
  "reasoning": "one short sentence"
}

Scoring rules:
- correctness: 2 = conveys the expected facts (or, when not covered, correctly declines); 1 = partially correct or hedged; 0 = wrong, or contradicts the expected facts.
- specificity: 2 = concrete PNU-specific detail (exact hours, site names, office names, form names); 1 = some specifics but mostly general; 0 = generic advice that would apply to any Korean university.
- hallucination: true if the answer states a PNU-specific fact (a number, URL, office, price, hour limit) that is NOT in the expected facts and is presented as established. Generic advice is not hallucination. Correctly declining is not hallucination.
- gap_handled_well: for a not_covered question, true if the answer admits the gap or defers to an official source instead of inventing PNU specifics. Use null when coverage is "covered".`;
}

function parseJudge(raw) {
  const text = String(raw || "").replace(/```(?:json)?/gi, "").trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("judge returned no JSON object");
  const parsed = JSON.parse(match[0]);
  const clamp = (v) => Math.max(0, Math.min(2, Number(v) || 0));
  return {
    correctness: clamp(parsed.correctness),
    specificity: clamp(parsed.specificity),
    hallucination: Boolean(parsed.hallucination),
    gap_handled_well:
      parsed.gap_handled_well === null || parsed.gap_handled_well === undefined
        ? null
        : Boolean(parsed.gap_handled_well),
    reasoning: String(parsed.reasoning || "").slice(0, 300),
  };
}

/**
 * Direct single-model call. Deliberately does NOT reuse generateOpenRouterChat:
 * that helper falls back down a chain on failure, so a judge that errored would
 * silently be replaced by the same model that produced the answer, and the run
 * would look fine while actually being self-graded.
 */
async function callModel(model, prompt, { maxTokens = 400, timeoutMs = 30000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://localhost:3000",
        "X-Title": "Hey! PNU benchmark",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0,
      }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("empty response");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function judge(q, answer) {
  const prompt = buildJudgePrompt(q, answer);
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return parseJudge(await callModel(JUDGE_MODEL, prompt));
    } catch (err) {
      if (attempt === 2) return { error: err.message };
      await sleep(1500);
    }
  }
}

/**
 * The answering side runs the product's own fallback chain, so a dead preferred
 * model is invisible — it just costs a wasted round-trip and quietly demotes the
 * run to a different model. Resolve it up front so the report names the model
 * that actually answered, and so the judge can be checked against it.
 */
async function resolveAnswerModel() {
  const chain = [
    process.env.OPENROUTER_MODEL,
    "google/gemini-2.5-flash",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-4-31b-it:free",
  ].filter(Boolean);

  for (const model of chain) {
    try {
      await callModel(model, "Reply with OK", { maxTokens: 8, timeoutMs: 15000 });
      return { model, deadAhead: chain.slice(0, chain.indexOf(model)) };
    } catch {
      /* try the next link, exactly as the product would */
    }
  }
  return { model: null, deadAhead: chain };
}

/* ------------------------------------------------------------------ scoring */

function summarise(rows, condition) {
  const mine = rows.filter((r) => r.condition === condition && !r.judgement?.error);
  if (!mine.length) return null;
  const covered = mine.filter((r) => r.coverage === "covered");
  const gaps = mine.filter((r) => r.coverage === "not_covered");
  const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

  return {
    condition,
    n: mine.length,
    accuracy: pct(mean(covered.map((r) => r.judgement.correctness)) * covered.length, covered.length * 2),
    specificity: pct(mean(covered.map((r) => r.judgement.specificity)) * covered.length, covered.length * 2),
    hallucinationRate: pct(mine.filter((r) => r.judgement.hallucination).length, mine.length),
    gapHandling: pct(gaps.filter((r) => r.judgement.gap_handled_well).length, gaps.length),
    retrievalHitRate:
      condition === "okf" ? pct(covered.filter((r) => r.retrieved).length, covered.length) : null,
    medianLatencyMs: mine.map((r) => r.ms).sort((a, b) => a - b)[Math.floor(mine.length / 2)],
  };
}

function renderMarkdown(summaries, rows, meta) {
  const okf = summaries.find((s) => s?.condition === "okf");
  const base = summaries.find((s) => s?.condition === "baseline");
  const fmt = (v, unit = "%") => (v === null || v === undefined ? "—" : `${v}${unit}`);
  const delta = (a, b) => {
    if (a === null || b === null || a === undefined || b === undefined) return "—";
    const d = Math.round((a - b) * 10) / 10;
    return `${d > 0 ? "+" : ""}${d} pts`;
  };

  const lines = [
    `# Hey! PNU — OKF benchmark`,
    ``,
    `Run ${meta.startedAt} · ${meta.questionCount} questions · answer model \`${meta.answerModel}\` · judge \`${meta.judgeModel}\``,
    ``,
    `Both conditions use the same model and the same system instruction. The only`,
    `difference is whether the Open Knowledge Framework supplied retrieved context.`,
    ``,
    `| Metric | OKF (Hey! PNU) | Non-OKF baseline | Difference |`,
    `|---|---:|---:|---:|`,
    `| Accuracy on covered questions | ${fmt(okf?.accuracy)} | ${fmt(base?.accuracy)} | ${delta(okf?.accuracy, base?.accuracy)} |`,
    `| PNU-specificity | ${fmt(okf?.specificity)} | ${fmt(base?.specificity)} | ${delta(okf?.specificity, base?.specificity)} |`,
    `| Hallucination rate (lower is better) | ${fmt(okf?.hallucinationRate)} | ${fmt(base?.hallucinationRate)} | ${delta(okf?.hallucinationRate, base?.hallucinationRate)} |`,
    `| Admits gaps honestly | ${fmt(okf?.gapHandling)} | ${fmt(base?.gapHandling)} | ${delta(okf?.gapHandling, base?.gapHandling)} |`,
    `| Retrieval hit rate | ${fmt(okf?.retrievalHitRate)} | — | — |`,
    `| Median latency | ${fmt(okf?.medianLatencyMs, "ms")} | ${fmt(base?.medianLatencyMs, "ms")} | — |`,
    ``,
    `## Per-question results`,
    ``,
    `| # | Category | Cov. | OKF | Base | Retrieved |`,
    `|---|---|---|---|---|---|`,
  ];

  const ids = [...new Set(rows.map((r) => r.id))];
  for (const id of ids) {
    const o = rows.find((r) => r.id === id && r.condition === "okf");
    const b = rows.find((r) => r.id === id && r.condition === "baseline");
    const score = (r) => (r?.judgement?.error ? "err" : r ? `${r.judgement.correctness}/2` : "—");
    const q = o || b;
    lines.push(
      `| ${id} | ${q.category} | ${q.coverage === "covered" ? "yes" : "no"} | ${score(o)} | ${score(b)} | ${o ? (o.retrieved ? o.sources[0]?.slice(0, 30) || "yes" : "no") : "—"} |`,
    );
  }
  return lines.join("\n");
}

/* --------------------------------------------------------------------- main */

async function main() {
  const set = JSON.parse(await readFile(path.join(here, "questions.json"), "utf8"));
  const questions = LIMIT ? set.questions.slice(0, LIMIT) : set.questions;
  let answerModel = process.env.OPENROUTER_MODEL || "(OpenRouter default chain)";

  const covered = questions.filter((q) => q.coverage === "covered").length;
  console.log(`Question set v${set.version}: ${questions.length} question(s) ` +
    `(${covered} covered, ${questions.length - covered} gap-probes)`);
  console.log(`Conditions: ${CONDITIONS.join(", ")}`);
  console.log(`Answer model: ${answerModel}   Judge: ${JUDGE_MODEL}`);
  const calls = questions.length * CONDITIONS.length * 2; // answer + judge
  console.log(`Estimated API calls: ${calls}\n`);

  if (DRY_RUN) {
    console.log("--dry-run: no API calls made.\n");
    for (const q of questions.slice(0, 8)) {
      console.log(`  [${q.coverage === "covered" ? "KB" : "--"}] ${q.id.padEnd(8)} ${q.question.slice(0, 78)}`);
    }
    if (questions.length > 8) console.log(`  ... and ${questions.length - 8} more`);
    return;
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("✗ OPENROUTER_API_KEY is not set — the benchmark needs it for answers and judging.");
    process.exit(1);
  }

  const resolved = await resolveAnswerModel();
  if (!resolved.model) {
    console.error("✗ No model in the OpenRouter chain responded. Aborting rather than reporting a number.");
    process.exit(1);
  }
  if (resolved.deadAhead.length) {
    console.warn(
      `! ${resolved.deadAhead.join(", ")} did not respond — answers actually come from ` +
        `${resolved.model}. Worth fixing OPENROUTER_MODEL in .env; every request currently ` +
        `pays a wasted round-trip.\n`,
    );
  }
  if (resolved.model === JUDGE_MODEL) {
    console.error(
      `✗ Judge (${JUDGE_MODEL}) is the same model that produces the answers. That is ` +
        `self-evaluation, and the resulting number would not be defensible. ` +
        `Pass a different --judge.`,
    );
    process.exit(1);
  }
  console.log(`Answers resolved to: ${resolved.model}   Judge: ${JUDGE_MODEL} (independent)\n`);
  answerModel = resolved.model;

  const rows = [];
  for (const [i, q] of questions.entries()) {
    console.log(`[${i + 1}/${questions.length}] ${q.id}  ${q.question.slice(0, 62)}...`);
    for (const condition of CONDITIONS) {
      const runner = RUNNERS[condition];
      if (!runner) throw new Error(`Unknown condition: ${condition}`);
      let result;
      try {
        result = await runner(q.question);
      } catch (err) {
        console.log(`     ${condition.padEnd(8)} ANSWER FAILED — ${err.message}`);
        rows.push({ ...q, condition, error: err.message, judgement: { error: err.message } });
        continue;
      }
      const judgement = await judge(q, result.answer);
      rows.push({
        id: q.id,
        category: q.category,
        coverage: q.coverage,
        question: q.question,
        condition,
        answer: result.answer,
        retrieved: result.retrieved,
        sources: result.sources,
        ms: result.ms,
        judgement,
      });
      const j = judgement.error
        ? `judge error: ${judgement.error}`
        : `correct ${judgement.correctness}/2  specific ${judgement.specificity}/2` +
          `${judgement.hallucination ? "  HALLUCINATION" : ""}` +
          `${result.retrieved ? `  [${result.sources[0]?.slice(0, 28) || "retrieved"}]` : condition === "okf" ? "  [no context]" : ""}`;
      console.log(`     ${condition.padEnd(8)} ${j}`);
      await sleep(PAUSE_MS);
    }
  }

  const summaries = CONDITIONS.map((c) => summarise(rows, c)).filter(Boolean);
  const meta = {
    startedAt: new Date().toISOString(),
    questionCount: questions.length,
    answerModel,
    judgeModel: JUDGE_MODEL,
    questionSetVersion: set.version,
  };

  await mkdir(RESULTS_DIR, { recursive: true });
  const stamp = meta.startedAt.replace(/[:.]/g, "-");
  const jsonPath = path.join(RESULTS_DIR, `${stamp}.json`);
  const mdPath = path.join(RESULTS_DIR, `${stamp}.md`);
  await writeFile(jsonPath, JSON.stringify({ meta, summaries, rows }, null, 2));
  await writeFile(mdPath, renderMarkdown(summaries, rows, meta));

  console.log(`\n${renderMarkdown(summaries, rows, meta).split("\n## Per-question")[0]}`);
  console.log(`\nWrote ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`Wrote ${path.relative(process.cwd(), mdPath)}`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
