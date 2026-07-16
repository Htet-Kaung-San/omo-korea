# Agent Task Brief: Extracurricular Program Pipeline (Hey! PNU)

You are setting up a working pipeline in this repo. The core logic files
already exist — your job is to provision infra, wire it up, verify it runs
end to end, and extend it per the notes below. Do not just describe what to
do; execute each step and confirm the result before moving to the next.

## Objective

Pull 비교과 (extracurricular) program announcements from **public** PNU
notice boards (no login required — do not attempt to scrape anything behind
`login.pusan.ac.kr` or `my.pusan.ac.kr` SSO), extract structured data with
the Claude API, and store it in Supabase so the Hey! PNU app can show each
user a recommended subset based on their interests.

**Hard requirement:** every program shown in the app must link back to the
original announcement post on the actual PNU website (`programs.source_url`)
— not just to an application form. If a program also has a separate
application link (Google Form, jasoseol.com, etc.), that's a second,
distinct link (`programs.external_apply_url`). Never merge these into one
field or drop `source_url` in favor of the apply link. Treat missing
`source_url` on any program row as a bug to fix, not an edge case to ignore.

## Files already provided — read before writing new code

- `schema.sql` — full Postgres schema: `notice_sources`, `raw_announcements`,
  `programs`, and a `recommended_programs()` RPC for tag-based matching.
- `scripts/scrape-notices.mjs` — fetches list pages, finds article links,
  stores raw text per source in `raw_announcements`. Dedupes on `source_url`.
- `scripts/extract-programs.mjs` — sends unprocessed rows to Claude, inserts
  structured `programs` rows with `status = 'pending_review'`.
- `.github/workflows/scrape-programs.yml` — daily scheduled run of both
  scripts via GitHub Actions.

## Your tasks

1. **Provision.** Confirm a Supabase project exists (ask the user for the
   project ref/URL if not already known from prior context). Run
   `schema.sql` against it. It uses `alter table programs add column if not
   exists ...` against the **existing** `programs` table (`program_id`
   serial PK, `name`, `category`, `deadline` already present) — do not
   drop or recreate that table. Confirm the `profiles` table referenced in
   the `alter table profiles add column ...` line actually exists first —
   if the app doesn't have a `profiles`/user table yet, stop and ask rather
   than silently creating one with assumptions about its shape.

   The 7 existing rows in `programs` (PNU Buddy Program, Academic Tutoring,
   TOPIK Prep, etc.) will have `source_url = NULL` after this migration,
   since they predate the scraper. Either backfill `source_url` for those 7
   manually (find each program's real announcement page) or leave them as
   `pending_review`/unpublished until backfilled — do not publish a program
   with a null `source_url`, since that violates the hard requirement above.

2. **Seed one source.** Insert the confirmed working example into
   `notice_sources`:
   ```sql
   insert into notice_sources (name, department, list_url, base_url, parser_key)
   values (
     '학생처 취업전략과 공지사항',
     '학생처',
     'https://www.pusan.ac.kr/kor/CMS/Board/Board.do?mCode=MN095&mode=list&mgr_seq=3',
     'https://www.pusan.ac.kr',
     'pnu_cms_board'
   );
   ```

3. **Install deps and do a live test run** of both scripts locally with real
   credentials:
   ```bash
   npm install @supabase/supabase-js @anthropic-ai/sdk cheerio
   node scripts/scrape-notices.mjs
   node scripts/extract-programs.mjs
   ```
   Inspect the resulting rows in `raw_announcements` and `programs`.
   **Verify `raw_text` isn't full of nav-menu/footer junk** — if it is, the
   `articleText` selector in `scrape-notices.mjs` needs tightening for that
   board's actual DOM (view real page source, not just this brief, to find
   the right container). Verify every inserted `programs` row has a
   non-null `source_url` pointing at the real announcement page.

4. **Wire up secrets** for the GitHub Actions workflow
   (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`) and
   confirm the workflow runs successfully via manual dispatch before relying
   on the cron schedule.

5. **Build the app-facing read path**: a query (or Supabase RPC call) the
   Hey! PNU frontend uses to fetch `recommended_programs(user_tags)`, and a
   program card/detail component showing `programs.name` /
   `programs.category` / `programs.deadline`, where tapping the card opens
   `programs.source_url` (original post) — with `external_apply_url` surfaced
   as a separate, clearly labeled action only when it differs from
   `source_url`.

6. **Do not auto-publish.** Leave `status = 'pending_review'` as the
   insert default and do not add logic that flips rows to `published`
   automatically. That gate is intentional: LLM-extracted dates and links are
   sometimes wrong, and a wrong deadline shown to a student is a real harm,
   not a cosmetic bug. If asked to build the review/approval UI, do that as
   a separate explicit task, not bundled into automated publishing.

## Extending to more boards

Each additional board needs, at minimum:
- A `notice_sources` row with the correct `list_url` and `base_url`.
- A working `parser_key` — reuse `pnu_cms_board` if the target board is
  another `Board.do?mCode=...` page on `pusan.ac.kr`; reuse `pnu_dept_bbs`
  for department subdomains using the `artclView.do` pattern; otherwise add
  a new entry to the `parsers` object in `scrape-notices.mjs` after
  inspecting that board's actual page source.

Reasonable boards to add next (all public, no login required — confirm this
for each before adding): 취업전략과 (job.pusan.ac.kr), 언어교육원
(lei.pusan.ac.kr), 효원상담원 (pnucounsel.pusan.ac.kr), individual college
공지사항 pages.

## Acceptance checklist

- [ ] `schema.sql` applied without errors against the real project, existing
      `programs` table intact (7 pre-existing rows still present, `name` /
      `category` / `deadline` untouched)
- [ ] At least one full pipeline run completed with real new rows in `programs`
- [ ] Every **published** `programs` row has a valid, working `source_url`
      (existing 7 rows backfilled or left unpublished until they are)
- [ ] `recommended_programs()` RPC returns results when called with a sample
      tag array
- [ ] GitHub Actions workflow runs green on manual dispatch
- [ ] App-side card/detail UI links out to `source_url`, with
      `external_apply_url` shown separately only when different