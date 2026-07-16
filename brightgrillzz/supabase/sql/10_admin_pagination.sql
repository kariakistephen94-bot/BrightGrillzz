-- ============================================================================
-- BrightGrillzz — 10. Aggregates for server-side pagination
-- Run AFTER 01–09. Idempotent — safe to re-run.
--
-- Server-side pagination lists only one page of rows at a time, so the header
-- stat cards, tab counts and (for customers) the grouped rows can no longer be
-- computed in app code from the full set. These views push that aggregation
-- into Postgres. Every view uses security_invoker so the caller's RLS applies
-- (staff/admin only) — same convention as 06_analytics.sql. No triggers.
-- ============================================================================

-- 1. Order stat cards + tab counts (single row) ------------------------------
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
  coalesce(sum(total) filter (where status = 'completed'), 0) as revenue_completed
from public.orders;

-- 2. One row per customer (grouped by email → phone → name) -------------------
-- Mirrors the app's previous in-memory aggregation so pagination/search/segment
-- can run in SQL. `id` is the stable grouping key; segment is derived in app
-- from `orders` (vip ≥ 10, returning 2–9, new = 1).
create or replace view public.admin_customers
with (security_invoker = on) as
select
  coalesce(lower(trim(nullif(customer_email, ''))), customer_phone, customer_name) as id,
  (array_agg(customer_name order by created_at desc))[1]  as name,
  coalesce(lower(trim(max(customer_email))), '')          as email,
  (array_agg(customer_phone order by created_at desc))[1] as phone,
  count(*)                                                as orders,
  -- Cancelled orders don't add to what a customer has actually spent.
  coalesce(sum(total) filter (where status <> 'cancelled'), 0) as spent,
  max(created_at)                                         as last_order_at
from public.orders
group by 1;

-- 3. Customer stat cards (single row over the grouped view) ------------------
create or replace view public.admin_customer_stats
with (security_invoker = on) as
select
  count(*)                                as total,
  count(*) filter (where orders >= 10)    as vips,
  count(*) filter (where orders > 1)      as repeat_customers,
  coalesce(round(avg(spent)), 0)          as avg_spent
from public.admin_customers;

-- 4. Review stat cards + rating distribution (single row) --------------------
create or replace view public.admin_review_stats
with (security_invoker = on) as
select
  count(*)                                 as total,
  count(*) filter (where is_published)     as published,
  coalesce(round(avg(rating)::numeric, 1), 0) as avg_rating,
  count(*) filter (where rating = 5)       as r5,
  count(*) filter (where rating = 4)       as r4,
  count(*) filter (where rating = 3)       as r3,
  count(*) filter (where rating = 2)       as r2,
  count(*) filter (where rating = 1)       as r1
from public.reviews;

-- 5. Menu stat card (single row) ---------------------------------------------
create or replace view public.admin_menu_stats
with (security_invoker = on) as
select
  count(*)                                 as total,
  count(*) filter (where is_available)     as available
from public.menu_items;

grant select on
  public.admin_order_stats,
  public.admin_customers,
  public.admin_customer_stats,
  public.admin_review_stats,
  public.admin_menu_stats
to authenticated;
