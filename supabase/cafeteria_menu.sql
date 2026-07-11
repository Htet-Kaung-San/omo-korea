-- Run in Supabase SQL editor
create table if not exists cafeteria_menu (
  menu_id bigint generated always as identity primary key,
  facility_key text not null unique,
  campus text not null default '부산캠퍼스',
  dining_hall text not null,
  -- Optional localized hall names (fallback: dining_hall): dining_hall_en, dining_hall_ko, dining_hall_vi, etc.
  week_start date,
  week_end date,
  origin_notice text,
  meals jsonb not null default '[]'::jsonb,
  source_url text,
  scraped_at timestamptz not null default now()
);

create index if not exists cafeteria_menu_scraped_at_idx on cafeteria_menu (scraped_at desc);
