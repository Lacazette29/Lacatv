-- ═══════════════════════════════════════════════════
-- LACA TV — Analytics: page_views table
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════

create table if not exists page_views (
  id         uuid primary key default gen_random_uuid(),
  page       text not null,           -- 'home', 'admin', or video id
  device     text default 'desktop',  -- 'mobile' | 'desktop'
  country    text,                    -- optional, from IP lookup
  referrer   text,                    -- where visitor came from
  created_at timestamptz default now()
);

-- Public insert (anonymous visitors can log views)
alter table page_views enable row level security;
create policy "public insert page_views" on page_views for insert with check (true);
create policy "auth read page_views"    on page_views for select using (auth.uid() is not null);

-- Enable realtime
alter publication supabase_realtime add table page_views;

-- Index for fast date-range queries
create index if not exists idx_page_views_created_at on page_views(created_at desc);
create index if not exists idx_page_views_page       on page_views(page);
