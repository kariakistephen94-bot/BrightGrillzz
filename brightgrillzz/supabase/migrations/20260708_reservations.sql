-- ============================================================================
-- Migration: reservations (grill experience enquiries from the homepage form)
-- Run once in Supabase (SQL Editor or `supabase db push`). Safe to re-run.
-- ============================================================================

create table if not exists public.reservations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  email       text,
  event_type  text,
  location    text,
  event_at    timestamptz,
  guests      integer,
  package     text,
  notes       text,
  status      text not null default 'new',   -- new | confirmed | closed | cancelled
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists reservations_created_at_idx on public.reservations (created_at desc);
create index if not exists reservations_status_idx on public.reservations (status);

alter table public.reservations enable row level security;

-- Anyone may submit a reservation request from the storefront.
drop policy if exists reservations_insert on public.reservations;
create policy reservations_insert on public.reservations
  for insert with check (true);

-- Only staff/admin may read, update or delete them.
drop policy if exists reservations_staff_read on public.reservations;
create policy reservations_staff_read on public.reservations
  for select using (public.is_staff());

drop policy if exists reservations_staff_write on public.reservations;
create policy reservations_staff_write on public.reservations
  for all using (public.is_staff()) with check (public.is_staff());

-- Whole-dataset counts for the admin stat cards + tab badges.
create or replace view public.admin_reservation_stats
with (security_invoker = true) as
select
  count(*)                                         as total,
  count(*) filter (where status = 'new')           as new,
  count(*) filter (where status = 'confirmed')     as confirmed,
  count(*) filter (where status = 'closed')        as closed,
  count(*) filter (where status = 'cancelled')     as cancelled
from public.reservations;
