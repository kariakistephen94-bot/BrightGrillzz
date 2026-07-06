-- ============================================================================
-- Migration: request-a-quote ordering model (Phase 1)
-- Run once in Supabase (SQL Editor or `supabase db push`). Safe to re-run.
--
-- The storefront no longer shows prices. A customer sends a REQUEST (items +
-- quantities, no money). It lands as an 'awaiting_quote' order with null
-- amounts. Admin later prices it (Phase 2), moving it to 'quoted' with amounts.
-- Menu items keep their `price` column as a hidden reference for admin quoting.
-- ============================================================================

-- 1. New order statuses. ADD VALUE is safe to re-run with IF NOT EXISTS and must
--    not be used by other statements in the same transaction, so run this block
--    on its own if your client wraps everything in one transaction.
alter type public.order_status add value if not exists 'awaiting_quote' before 'pending';
alter type public.order_status add value if not exists 'quoted' before 'pending';

-- 2. A request has no amounts or payment method until it is quoted.
alter table public.orders alter column subtotal drop not null;
alter table public.orders alter column subtotal drop default;
alter table public.orders alter column total drop not null;
alter table public.orders alter column total drop default;
alter table public.orders alter column payment_method drop not null;
alter table public.orders alter column payment_method drop default;

-- 3. Line items have no unit price until the order is quoted.
--    (line_total is a generated column: unit_price * qty, so it is null too.)
alter table public.order_items alter column unit_price drop not null;
alter table public.order_items alter column unit_price drop default;

-- 4. Timestamp for when a request was quoted (filled in Phase 2).
alter table public.orders add column if not exists quoted_at timestamptz;
