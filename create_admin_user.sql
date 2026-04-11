-- ═══════════════════════════════════════════════════
-- LACA TV — Create Admin User in Supabase Auth
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════

-- Create the admin user
select auth.create_user(
  uid        := gen_random_uuid(),
  email      := 'Markethub92@gmail.com',
  password   := 'Noreply442@#',
  email_confirm := true
);

-- ── Update RLS policies to use auth.uid() ──────────
-- Drop old policies first
drop policy if exists "auth insert videos"   on videos;
drop policy if exists "auth update videos"   on videos;
drop policy if exists "auth delete videos"   on videos;
drop policy if exists "auth update scores"   on live_scores;
drop policy if exists "auth insert scores"   on live_scores;
drop policy if exists "auth delete scores"   on live_scores;
drop policy if exists "auth update settings" on site_settings;
drop policy if exists "auth insert leagues"  on leagues;
drop policy if exists "auth update leagues"  on leagues;

-- Re-create with proper auth check
create policy "auth insert videos"   on videos        for insert with check (auth.uid() is not null);
create policy "auth update videos"   on videos        for update using (auth.uid() is not null);
create policy "auth delete videos"   on videos        for delete using (auth.uid() is not null);
create policy "auth insert scores"   on live_scores   for insert with check (auth.uid() is not null);
create policy "auth update scores"   on live_scores   for update using (auth.uid() is not null);
create policy "auth delete scores"   on live_scores   for delete using (auth.uid() is not null);
create policy "auth update settings" on site_settings for update using (auth.uid() is not null);
create policy "auth insert leagues"  on leagues       for insert with check (auth.uid() is not null);
create policy "auth update leagues"  on leagues       for update using (auth.uid() is not null);

-- Also allow upsert on live_scores for the Football API sync (uses anon key)
create policy "anon upsert scores" on live_scores
  for insert with check (true);
