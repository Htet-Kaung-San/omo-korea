# OKF benchmark

Measures the Hey! PNU assistant against a **non-OKF baseline** — the same model,
with the same system instruction, answering the same questions *without* the
Open Knowledge Framework supplying retrieved context. The only variable is the
knowledge base, so the difference between the two columns is what the OKF buys.

## Running it

```bash
node benchmark/run-benchmark.mjs --dry-run    # plan and cost, no API calls
node benchmark/run-benchmark.mjs --limit 5    # smoke test
node benchmark/run-benchmark.mjs              # full run (40 questions)
```

Options: `--conditions okf,baseline`, `--judge <model>`, `--limit N`, `--pause ms`.

Each run writes two files to `results/`:

- `<timestamp>.json` — every answer, every judgement, retrieval sources, latency
- `<timestamp>.md` — the summary table, ready to paste into a slide

## Question set

`questions.json` — 40 questions in three kinds:

| Kind | Count | Measures |
|---|---|---|
| `coverage: covered` | 31 | Does the OKF retrieve the answer and use it? Expected facts are quoted verbatim from the KB document named in `source`, so grading is checkable rather than a matter of taste. |
| `coverage: not_covered` | 9 | The KB has no answer. Does the assistant **admit the gap** instead of inventing PNU-specific detail? A confident wrong answer about dormitory prices is worse than "I don't know". |
| `adv-*` | 3 | Questions where a generic model is confidently wrong — e.g. the widely repeated "international students can work 20 hours a week", which is not the applicable figure at PNU. |

When you add a question, quote its expected facts from a real KB document and
name that document in `source`. A question whose ground truth is invented makes
the whole number unciteable.

## Methodology notes

**The judge is deliberately a different vendor from the answerer.** The answering
chain resolves to Google Gemini today, so the judge defaults to
`openai/gpt-4o-mini`. The harness **refuses to run** if the two resolve to the
same model — self-graded numbers are not defensible in a presentation.

**The judge call does not use the product's fallback chain.** `generateOpenRouterChat`
silently falls back down a list of models on failure; a judge built on it could
quietly become the same model that wrote the answer, and the run would look fine
while being self-evaluation. The judge therefore makes its own single-model call
and fails loudly.

**The answering side deliberately does use the product's chain**, because the
point is to measure the real product. The harness resolves and reports which
model actually answered, so a dead `OPENROUTER_MODEL` cannot silently change
what was measured.

## Known limitations

- Rows whose answer or judgement failed are excluded from the aggregates, so the
  two conditions can end up with slightly different denominators. Check `n` per
  condition in the JSON before quoting a figure.
- The judge is an LLM. Spot-check ~10 rows by hand before putting a number in
  front of an audience.
- Retrieval precision is not yet where it should be: PNU-adjacent questions the
  KB does not cover (dormitories, cafeteria, gym) still retrieve *something*
  above the 0.65 threshold. It does not appear to cause hallucination — the
  model declines anyway — but the retrieved context is noise, and a future
  threshold or reranking change should be measured against this same set.
