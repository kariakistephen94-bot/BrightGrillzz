-- ============================================================================
-- Migration: daily "price of the day" store for the quote engine
-- Run once in Supabase (SQL Editor or `supabase db push`). Safe to re-run.
--
-- When admin quotes an item, that item's price is locked for the current day.
-- Any later request the same day pre-fills the same price. The next day starts
-- fresh (falling back to the menu item's reference price).
-- ============================================================================

create table if not exists public.daily_item_prices (
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  day          date not null default current_date,
  price        integer not null,   -- naira, no kobo
  updated_at   timestamptz not null default now(),
  primary key (menu_item_id, day)
);

alter table public.daily_item_prices enable row level security;

-- Only staff/admin may read or write the day's prices.
drop policy if exists daily_prices_staff on public.daily_item_prices;
create policy daily_prices_staff on public.daily_item_prices
  for all using (public.is_staff()) with check (public.is_staff());

-- Extend the order stats view so the admin tab badges count requests to quote
-- and quoted orders too. CREATE OR REPLACE VIEW can only ADD columns at the end
-- (it cannot reorder or rename existing ones), so the two new counts go last.
-- The app reads these by name, so column order does not matter.
create or replace view public.admin_order_stats
with (security_invoker = on) as
select
  count(*)                                                   as total,
  count(*) filter (where status = 'pending')                as pending,
  count(*) filter (where status = 'preparing')              as preparing,
  count(*) filter (where status = 'ready')                  as ready,
  count(*) filter (where status = 'out_for_delivery')       as out_for_delivery,
  count(*) filter (where status = 'completed')              as completed,
  count(*) filter (where status = 'cancelled')              as cancelled,
  coalesce(sum(total) filter (where status = 'completed'), 0) as revenue_completed,
  count(*) filter (where status = 'awaiting_quote')          as awaiting_quote,
  count(*) filter (where status = 'quoted')                  as quoted
from public.orders;
