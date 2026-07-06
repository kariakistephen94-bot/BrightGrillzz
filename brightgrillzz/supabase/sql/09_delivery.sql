-- ============================================================================
-- BrightGrillzz — 09. Out-for-delivery flow
-- Run AFTER 01–08 AND AFTER 09a_delivery_enum.sql. Idempotent — safe to re-run.
--
-- IMPORTANT: the 'out_for_delivery' enum value is added in 09a_delivery_enum.sql
-- and MUST be committed on its own run first. Postgres forbids adding a new enum
-- value and using it in the same transaction, and the function bodies below
-- reference 'out_for_delivery'.
--   Run order:  08_order_ops.sql  →  09a_delivery_enum.sql  →  09_delivery.sql
--
-- Adds:
--   • orders.rider_number, orders.out_for_delivery_at
--   • get_order_by_tracking() now returns rider_number + out_for_delivery_at
--   • confirm_delivery(tracking_id)  — customer marks their order delivered
--   • complete_stale_deliveries()    — auto-complete deliveries older than 24h
--
-- No triggers: the 24h auto-complete is a plain function the app calls on read.
-- ============================================================================

-- 1. Delivery columns --------------------------------------------------------
alter table public.orders add column if not exists rider_number        text;
alter table public.orders add column if not exists out_for_delivery_at  timestamptz;

-- 2. Public order tracking (adds rider_number + out_for_delivery_at) ----------
create or replace function public.get_order_by_tracking(p_tracking_id text)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select case when o.id is null then null else jsonb_build_object(
    'tracking_id',         o.tracking_id,
    'status',              o.status,
    'fulfillment_type',    o.fulfillment_type,
    'area',                o.area,
    'subtotal',            o.subtotal,
    'total',               o.total,
    'payment_method',      o.payment_method,
    'payment_confirmed',   o.payment_confirmed,
    'cancellation_note',   o.cancellation_note,
    'rider_number',        o.rider_number,
    'out_for_delivery_at', o.out_for_delivery_at,
    'created_at',          o.created_at,
    'updated_at',          o.updated_at,
    'items', coalesce(
      (select jsonb_agg(jsonb_build_object(
                'name', oi.name, 'qty', oi.qty,
                'unit_price', oi.unit_price, 'image', oi.image)
              order by oi.created_at)
       from public.order_items oi where oi.order_id = o.id),
      '[]'::jsonb)
  ) end
  from public.orders o
  where upper(o.tracking_id) = upper(trim(p_tracking_id))
  limit 1;
$$;

grant execute on function public.get_order_by_tracking(text) to anon, authenticated;

-- 3. Customer confirms delivery ----------------------------------------------
-- Flips ONLY an out_for_delivery order to completed. SECURITY DEFINER so an
-- anonymous customer can close their own order without any table write access.
create or replace function public.confirm_delivery(p_tracking_id text)
returns jsonb
language sql
security definer
volatile
set search_path = public
as $$
  with updated as (
    update public.orders
       set status = 'completed', updated_at = now()
     where upper(tracking_id) = upper(trim(p_tracking_id))
       and status = 'out_for_delivery'
    returning tracking_id, status
  )
  select case when u.tracking_id is null then null
              else jsonb_build_object('tracking_id', u.tracking_id, 'status', u.status) end
  from (select tracking_id, status from updated limit 1) u;
$$;

grant execute on function public.confirm_delivery(text) to anon, authenticated;

-- 4. Auto-complete stale deliveries (called by the app on read — NOT a trigger)
-- Any order still out_for_delivery 24h after dispatch is treated as completed.
create or replace function public.complete_stale_deliveries()
returns integer
language sql
security definer
volatile
set search_path = public
as $$
  with updated as (
    update public.orders
       set status = 'completed', updated_at = now()
     where status = 'out_for_delivery'
       and out_for_delivery_at is not null
       and out_for_delivery_at < now() - interval '24 hours'
    returning 1
  )
  select count(*)::int from updated;
$$;

grant execute on function public.complete_stale_deliveries() to authenticated;
