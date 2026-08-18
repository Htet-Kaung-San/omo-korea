-- Make a scraped notice's stable source identity canonical.
--
-- PNU CMS detail URLs include a moving `page` query parameter. The same
-- board_seq can therefore appear under multiple source_url values as notices
-- move between list pages. Keep the oldest notice_id, preserve the newest
-- scrape timestamp, remove identical later copies, and prevent recurrence.

begin;

lock table public.notice in share row exclusive mode;

-- Refuse to discard a row if an identity collision contains different
-- business data. URL and audit timestamps are expected to differ.
do $$
begin
  if exists (
    with ranked as (
      select
        notice_id,
        first_value(notice_id) over (
          partition by source, external_id
          order by notice_id asc
        ) as survivor_id,
        row_number() over (
          partition by source, external_id
          order by notice_id asc
        ) as identity_rank
      from public.notice
      where source is not null
        and external_id is not null
    )
    select 1
    from ranked
    join public.notice as duplicate
      on duplicate.notice_id = ranked.notice_id
    join public.notice as survivor
      on survivor.notice_id = ranked.survivor_id
    where ranked.identity_rank > 1
      and (
        duplicate.title is distinct from survivor.title
        or duplicate.content is distinct from survivor.content
        or duplicate.language is distinct from survivor.language
        or duplicate.posted_date is distinct from survivor.posted_date
        or duplicate.source_id is distinct from survivor.source_id
        or duplicate.department_id is distinct from survivor.department_id
        or duplicate.category is distinct from survivor.category
        or duplicate.tags is distinct from survivor.tags
        or duplicate.is_extracurricular is distinct from survivor.is_extracurricular
      )
  ) then
    raise exception 'notice identity collision contains divergent business data';
  end if;
end
$$;

with duplicate_groups as (
  select
    source,
    external_id,
    min(notice_id) as survivor_id,
    max(scraped_at) as latest_scraped_at
  from public.notice
  where source is not null
    and external_id is not null
  group by source, external_id
  having count(*) > 1
)
update public.notice as survivor
set scraped_at = duplicate_groups.latest_scraped_at
from duplicate_groups
where survivor.notice_id = duplicate_groups.survivor_id;

with ranked as (
  select
    notice_id,
    row_number() over (
      partition by source, external_id
      order by notice_id asc
    ) as identity_rank
  from public.notice
  where source is not null
    and external_id is not null
)
delete from public.notice as duplicate
using ranked
where duplicate.notice_id = ranked.notice_id
  and ranked.identity_rank > 1;

create unique index if not exists notice_source_external_id_uidx
  on public.notice (source, external_id)
  where source is not null
    and external_id is not null;

commit;
