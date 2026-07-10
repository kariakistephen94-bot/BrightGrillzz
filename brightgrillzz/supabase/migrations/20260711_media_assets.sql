-- ============================================================================
-- Migration: media_assets — admin-managed gallery (images + short videos)
-- Run once in Supabase (SQL Editor or `supabase db push`). Safe to re-run.
--
-- Files themselves live in Cloudinary (uploaded unsigned, straight from the
-- browser). This table only stores the resulting URL + light metadata so the
-- storefront can render the gallery, the home slideshow and the video showcase.
-- Existing Supabase-hosted menu photos are untouched; nothing here deletes them.
-- No trigger functions — publish/feature flags are plain columns the app writes.
-- ============================================================================

create table if not exists public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('image', 'video')),
  url          text not null,                 -- Cloudinary secure_url
  public_id    text,                          -- Cloudinary public_id (for reference)
  poster_url   text,                          -- video thumbnail (derived from Cloudinary)
  title        text,
  caption      text,
  -- Featured items surface on the home page (slideshow / showcase); everything
  -- published shows in the gallery.
  featured     boolean not null default false,
  is_published boolean not null default true,
  -- When true the item can be added to a request/order from the storefront;
  -- when false it is display-only (a moment, not something to shop).
  available_for_request boolean not null default true,
  width        integer,
  height       integer,
  duration     numeric,                       -- seconds, videos only
  format       text,
  bytes        integer,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists media_assets_published_idx
  on public.media_assets (is_published, kind, sort_order, created_at desc);

alter table public.media_assets enable row level security;

-- Anyone (anon storefront) may read published media.
drop policy if exists media_public_read on public.media_assets;
create policy media_public_read on public.media_assets
  for select using (is_published = true);

-- Staff/admin may do everything (read drafts, insert, update, delete).
drop policy if exists media_staff_all on public.media_assets;
create policy media_staff_all on public.media_assets
  for all using (public.is_staff()) with check (public.is_staff());
