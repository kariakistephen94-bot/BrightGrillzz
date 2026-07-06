-- ============================================================================
-- BrightGrillzz — 08. Order operations + range-aware analytics
-- Run AFTER 01–06. Idempotent — safe to re-run.
--
-- Adds:
--   • orders.cancellation_note      (message shown to the customer on cancel)
--   • get_order_by_tracking()       now also returns status note + updated_at
--   • get_admin_analytics(range)    KPIs + time series for a chosen window
-- ============================================================================

-- 1. Cancellation note -------------------------------------------------------
alter table public.orders
  add column if not exists cancellation_note text;

-- 2. Public order tracking (adds cancellation_note + updated_at) --------------
create or replace function public.get_order_by_tracking(p_tracking_id text)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select case when o.id is null then null else jsonb_build_object(
    'tracking_id',       o.tracking_id,
    'status',            o.status,
    'fulfillment_type',  o.fulfillment_type,
    'area',              o.area,
    'subtotal',          o.subtotal,
    'total',             o.total,
    'payment_method',    o.payment_method,
    'payment_confirmed', o.payment_confirmed,
    'cancellation_note', o.cancellation_note,
    'created_at',        o.created_at,
    'updated_at',        o.updated_at,
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

-- 3. Range-aware analytics ---------------------------------------------------
-- p_range ∈ {'24h','7d','30d','3m','1y'}. Returns KPIs (with deltas vs. the
-- preceding equal-length window), a zero-filled time series, category split,
-- top items and fulfillment/payment splits — all scoped to the window.
create or replace function public.get_admin_analytics(p_range text default '30d')
returns jsonb
language plpgsql
security invoker
stable
set search_path = public
as $$
declare
  v_interval   interval;
  v_bucket     text;
  v_now        timestamptz := now();
  v_since      timestamptz;
  v_prev_since timestamptz;
  v_result     jsonb;
begin
  case p_range
    when '24h' then v_interval := interval '24 hours'; v_bucket := 'hour';
    when '7d'  then v_interval := interval '7 days';   v_bucket := 'day';
    when '30d' then v_interval := interval '30 days';  v_bucket := 'day';
    when '3m'  then v_interval := interval '3 months'; v_bucket := 'week';
    when '1y'  then v_interval := interval '1 year';   v_bucket := 'month';
    else            v_interval := interval '30 days';  v_bucket := 'day';
  end case;

  v_since      := v_now - v_interval;
  v_prev_since := v_since - v_interval;

  with cur as (
    select coalesce(sum(total), 0) as revenue,
           count(*)                as orders,
           count(distinct coalesce(customer_email, customer_phone)) as customers
    from public.orders
    where created_at >= v_since
  ),
  prev as (
    select coalesce(sum(total), 0) as revenue, count(*) as orders
    from public.orders
    where created_at >= v_prev_since and created_at < v_since
  ),
  buckets as (
    select generate_series(
             date_trunc(v_bucket, v_since),
             date_trunc(v_bucket, v_now),
             ('1 ' || v_bucket)::interval
           ) as ts
  ),
  series as (
    select b.ts,
           coalesce(sum(o.total), 0) as revenue,
           count(o.id)               as orders
    from buckets b
    left join public.orders o
      on date_trunc(v_bucket, o.created_at) = b.ts
     and o.created_at >= v_since
    group by b.ts
    order by b.ts
  ),
  cats as (
    select coalesce(mi.category, 'Other') as category,
           coalesce(sum(oi.line_total), 0) as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id and o.created_at >= v_since
    left join public.menu_items mi on mi.id = oi.menu_item_id
    group by 1
    order by 2 desc
  ),
  items as (
    select oi.name,
           sum(oi.qty)        as orders,
           sum(oi.line_total) as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id and o.created_at >= v_since
    group by oi.name
    order by orders desc
    limit 5
  ),
  splits as (
    select
      count(*) filter (where fulfillment_type = 'delivery')      as delivery,
      count(*) filter (where fulfillment_type = 'pickup')        as pickup,
      count(*) filter (where payment_method   = 'paystack')      as paystack,
      count(*) filter (where payment_method   = 'bank_transfer') as bank_transfer
    from public.orders
    where created_at >= v_since
  )
  select jsonb_build_object(
    'range',  p_range,
    'bucket', v_bucket,
    'kpis', jsonb_build_object(
      'revenue',         (select revenue from cur),
      'orders',          (select orders from cur),
      'avg_order_value', (select case when orders > 0 then round(revenue::numeric / orders) else 0 end from cur),
      'customers',       (select customers from cur),
      'revenue_delta_pct', (select case when p.revenue > 0
                                        then round(((c.revenue - p.revenue)::numeric / p.revenue) * 100, 1)
                                        else null end from cur c, prev p),
      'orders_delta_pct',  (select case when p.orders > 0
                                        then round(((c.orders - p.orders)::numeric / p.orders) * 100, 1)
                                        else null end from cur c, prev p)
    ),
    'series',      coalesce((select jsonb_agg(jsonb_build_object('ts', ts, 'revenue', revenue, 'orders', orders)) from series), '[]'::jsonb),
    'by_category', coalesce((select jsonb_agg(jsonb_build_object('category', category, 'revenue', revenue)) from cats), '[]'::jsonb),
    'top_items',   coalesce((select jsonb_agg(jsonb_build_object('name', name, 'orders', orders, 'revenue', revenue)) from items), '[]'::jsonb),
    'splits',      (select jsonb_build_object('delivery', delivery, 'pickup', pickup, 'paystack', paystack, 'bank_transfer', bank_transfer) from splits)
  )
  into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_admin_analytics(text) to authenticated;
