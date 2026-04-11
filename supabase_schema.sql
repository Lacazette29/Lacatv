-- ═══════════════════════════════════════════════════
-- LACA TV — Supabase Schema + Seed Data
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════

-- ── LEAGUES ──────────────────────────────────────
create table if not exists leagues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  flag        text,
  color       text,
  sort_order  integer default 0,
  active      boolean default true
);

insert into leagues (name, flag, color, sort_order) values
  ('Premier League',   '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '#6c2eb9', 1),
  ('La Liga',          '🇪🇸',       '#c0392b', 2),
  ('Champions League', '🏆',        '#1a6baf', 3),
  ('Bundesliga',       '🇩🇪',       '#b8990a', 4),
  ('Serie A',          '🇮🇹',       '#014099', 5),
  ('AFCON',            '🌍',        '#1a7a3c', 6),
  ('NPFL',             '🇳🇬',       '#008751', 7),
  ('Ligue 1',          '🇫🇷',       '#1a4fa8', 8),
  ('Europa League',    '🏅',        '#e8531a', 9)
on conflict (name) do nothing;

-- ── VIDEOS ───────────────────────────────────────
create table if not exists videos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  league_id    uuid references leagues(id) on delete set null,
  video_url    text not null,
  duration     text,
  description  text,
  tags         text[] default '{}',
  views        integer default 0,
  bg_grad      text default '135deg,#0a2e18,#1a5e32',
  featured     boolean default false,
  is_new       boolean default true,
  uploaded_at  timestamptz default now()
);

-- Seed videos (uses league subqueries)
insert into videos (title, league_id, video_url, duration, description, tags, views, bg_grad, featured, is_new, uploaded_at)
select
  'Real Madrid 4-3 Man City — All Goals & Highlights',
  (select id from leagues where name='Champions League'),
  'https://www.w3schools.com/html/mov_bbb.mp4',
  '14:22',
  'Incredible Champions League semi-final with 7 goals! Real Madrid edge out Man City in a thriller.',
  array['Real Madrid','Man City','Champions League'],
  128000,
  '135deg,#0a2e18,#1a5e32',
  true, true,
  now() - interval '1 day'
where not exists (select 1 from videos where title like 'Real Madrid 4-3 Man City%');

insert into videos (title, league_id, video_url, duration, description, tags, views, bg_grad, featured, is_new, uploaded_at)
select
  'Arsenal 2-1 Tottenham — North London Derby Highlights',
  (select id from leagues where name='Premier League'),
  'https://www.w3schools.com/html/mov_bbb.mp4',
  '8:24',
  'Arsenal claim derby bragging rights with a late winner from Saka.',
  array['Arsenal','Tottenham','Premier League'],
  84000,
  '135deg,#1a0a2e,#2e1a5e',
  false, true,
  now() - interval '2 days'
where not exists (select 1 from videos where title like 'Arsenal 2-1 Tottenham%');

insert into videos (title, league_id, video_url, duration, description, tags, views, bg_grad, featured, is_new, uploaded_at)
select
  'Nigeria vs South Africa — AFCON 2025 Quarter Final',
  (select id from leagues where name='AFCON'),
  'https://www.w3schools.com/html/mov_bbb.mp4',
  '6:12',
  'Super Eagles dominate to reach the AFCON semi-finals. Osimhen hat-trick lights up the tournament.',
  array['Nigeria','South Africa','AFCON','Super Eagles'],
  210000,
  '135deg,#002200,#004d00',
  false, false,
  now() - interval '4 days'
where not exists (select 1 from videos where title like 'Nigeria vs South Africa%');

insert into videos (title, league_id, video_url, duration, description, tags, views, bg_grad, featured, is_new, uploaded_at)
select
  'Enyimba FC vs Rivers United — NPFL Matchday 22',
  (select id from leagues where name='NPFL'),
  'https://www.w3schools.com/html/mov_bbb.mp4',
  '5:58',
  'Enyimba FC claim a crucial three points at home in the NPFL title race.',
  array['Enyimba','Rivers United','NPFL','Nigeria'],
  18000,
  '135deg,#1a2200,#334400',
  false, true,
  now() - interval '1 day'
where not exists (select 1 from videos where title like 'Enyimba FC%');

-- ── LIVE SCORES ───────────────────────────────────
create table if not exists live_scores (
  id            uuid primary key default gen_random_uuid(),
  league        text not null,
  home_team     text not null,
  away_team     text not null,
  home_score    integer default 0,
  away_score    integer default 0,
  minute        integer default 0,
  status        text default 'upcoming',  -- 'live' | 'ft' | 'upcoming'
  match_date    timestamptz,
  home_scorers  text[] default '{}',
  away_scorers  text[] default '{}',
  updated_at    timestamptz default now()
);

-- Seed live scores
insert into live_scores (league, home_team, away_team, home_score, away_score, minute, status, match_date, home_scorers, away_scorers)
values
  ('EPL',        'Arsenal',     'Tottenham',  2, 1, 90, 'ft',       now() - interval '2 hours', array['Saka 45''', 'Martinelli 78'''], array['Son 30''']),
  ('La Liga',    'Barcelona',   'Atletico',   1, 1, 67, 'live',     now() - interval '67 minutes', array['Lewandowski 12'''], array['Griezmann 45''']),
  ('UCL',        'Real Madrid', 'Man City',   4, 3, 90, 'ft',       now() - interval '3 hours', array['Vinicius 10''', 'Bellingham 34''', 'Vinicius 67''', 'Modric 89'''], array['Haaland 20''', 'De Bruyne 55''', 'Foden 80''']),
  ('EPL',        'Chelsea',     'Man City',   0, 2, 45, 'live',     now() - interval '45 minutes', array[]::text[], array['Haaland 23''', 'Silva 41''']),
  ('Ligue 1',    'PSG',         'Marseille',  2, 0, 78, 'live',     now() - interval '78 minutes', array['Mbappe 15''', 'Dembele 60'''], array[]::text[]),
  ('NPFL',       'Enyimba',     'Rivers Utd', 1, 0, 90, 'ft',       now() - interval '4 hours', array['Okafor 82'''], array[]::text[]),
  ('Bundesliga', 'Bayern',      'Dortmund',   3, 2, 90, 'ft',       now() - interval '5 hours', array['Kane 12''', 'Kane 45''', 'Kane 78'''], array['Sancho 30''', 'Adeyemi 67'''])
on conflict do nothing;

-- ── SITE SETTINGS ────────────────────────────────
create table if not exists site_settings (
  id                integer primary key default 1,
  site_name         text default 'LACA TV',
  tagline           text default 'Football Highlights, Every Match.',
  ticker_enabled    boolean default true,
  maintenance_mode  boolean default false,
  allow_comments    boolean default false
);

insert into site_settings (id, site_name, tagline, ticker_enabled, maintenance_mode, allow_comments)
values (1, 'LACA TV', 'Football Highlights, Every Match.', true, false, false)
on conflict (id) do nothing;

-- ── ROW LEVEL SECURITY ────────────────────────────
alter table videos        enable row level security;
alter table leagues        enable row level security;
alter table live_scores   enable row level security;
alter table site_settings enable row level security;

-- Public read access
create policy "public read videos"        on videos        for select using (true);
create policy "public read leagues"        on leagues        for select using (true);
create policy "public read live_scores"   on live_scores   for select using (true);
create policy "public read site_settings" on site_settings for select using (true);

-- Auth write access (admin users only)
create policy "auth insert videos"   on videos        for insert with check (auth.role() = 'authenticated');
create policy "auth update videos"   on videos        for update using (auth.role() = 'authenticated');
create policy "auth delete videos"   on videos        for delete using (auth.role() = 'authenticated');
create policy "auth update scores"   on live_scores   for update using (auth.role() = 'authenticated');
create policy "auth insert scores"   on live_scores   for insert with check (auth.role() = 'authenticated');
create policy "auth delete scores"   on live_scores   for delete using (auth.role() = 'authenticated');
create policy "auth update settings" on site_settings for update using (auth.role() = 'authenticated');

-- ── REALTIME ─────────────────────────────────────
alter publication supabase_realtime add table live_scores;
alter publication supabase_realtime add table videos;

-- ── VIEWS INCREMENT FUNCTION ──────────────────────
create or replace function increment_views(video_id uuid)
returns void language sql as $$
  update videos set views = views + 1 where id = video_id;
$$;
