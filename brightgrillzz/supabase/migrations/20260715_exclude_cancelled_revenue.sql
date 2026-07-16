-- ============================================================================
-- Migration: exclude cancelled orders from revenue
-- Run once in Supabase (SQL Editor or `supabase db push`). Safe to re-run.
--
-- A cancelled order takes no money, so it must never inflate revenue. This
-- redefines every analytics object that summed order/line totals so each one
-- now ignores status = 'cancelled'. Order *counts* are left untouched — a
-- cancelled order still happened; it just contributes ₦0.
--
-- Objects redefined:
--   • admin_revenue_by_week   (view)     — weekly revenue
--   • admin_sales_by_category (view)     — revenue share by category
--   • admin_top_items         (view)     — best-sellers + their revenue
--   • admin_customers         (view)     — per-customer lifetime "spent"
--   • get_admin_overview()    (function) — 30-day KPI revenue + delta
--   • get_admin_analytics()   (function) — range-scoped KPIs, series, cats, items
-- ============================================================================

-- 1. Weekly revenue -----------------------------------------------------------
create or replace view public.admin_revenue_by_week
with (security_invoker = on) as
select
  date_trunc('week', created_at)::date as week_start,
  count(*)                              as orders,
  coalesce(sum(total) filter (where status <> 'cancelled'), 0) as revenue
from public.orders
where created_at >= date_trunc('week', now()) - interval '11 weeks'
group by 1
order by 1;

-- 2. Sales share by category --------------------------------------------------
create or replace view public.admin_sales_by_category
with (security_invoker = on) as
select
  coalesce(mi.category, 'Other')      as category,
  count(*)                            as items_sold,
  coalesce(sum(oi.line_total), 0)     as revenue
from public.order_items oi
join public.orders o on o.id = oi.order_id and o.status <> 'cancelled'
left join public.menu_items mi on mi.id = oi.menu_item_id
group by 1
order by revenue desc;

-- 3. Top selling items --------------------------------------------------------
create or replace view public.admin_top_items
with (security_invoker = on) as
select
  oi.name,
  sum(oi.qty)         as orders,
  sum(oi.line_total)  as revenue
from public.order_items oi
join public.orders o on o.id = oi.order_id and o.status <> 'cancelled'
group by oi.name
order by orders desc
limit 10;

grant select on
  public.admin_revenue_by_week,
  public.admin_sales_by_category,
  public.admin_top_items
to authenticated;

-- 4. Per-customer lifetime spend ---------------------------------------------
create or replace view public.admin_customers
with (security_invoker = on) as
select
  coalesce(lower(trim(nullif(customer_email, ''))), customer_phone, customer_name) as id,
  (array_agg(customer_name order by created_at desc))[1]  as name,
  coalesce(lower(trim(max(customer_email))), '')          as email,
  (array_agg(customer_phone order by created_at desc))[1] as phone,
  count(*)                                                as orders,
  coalesce(sum(total) filter (where status <> 'cancelled'), 0) as spent,
  max(created_at)                                         as last_order_at
from public.orders
group by 1;

-- 5. 30-day KPI overview ------------------------------------------------------
create or replace function public.get_admin_overview()
returns jsonb
language sql
security invoker
stable
set search_path = public
as $$
  with cur as (
    select coalesce(sum(total) filter (where status <> 'cancelled'), 0) as revenue,
           count(*) as orders,
           count(distinct customer_email) as customers
    from public.orders
    where created_at >= now() - interval '30 days'
  ),
  prev as (
    select coalesce(sum(total) filter (where status <> 'cancelled'), 0) as revenue,
           count(*) as orders
    from public.orders
    where created_at >= now() - interval '60 days'
      and created_at <  now() - interval '30 days'
  ),
  new_cust as (
    select count(*) as n from public.profiles
    where created_at >= now() - interval '30 days'
  )
  select jsonb_build_object(
    'revenue_30d',      cur.revenue,
    'orders_30d',       cur.orders,
    'avg_order_value',  case when cur.orders > 0 then round(cur.revenue::numeric / cur.orders) else 0 end,
    'new_customers_30d',(select n from new_cust),
    'revenue_delta_pct', case when prev.revenue > 0
                              then round(((cur.revenue - prev.revenue)::numeric / prev.revenue) * 100, 1)
                              else null end,
    'orders_delta_pct',  case when prev.orders > 0
                              then round(((cur.orders - prev.orders)::numeric / prev.orders) * 100, 1)
                              else null end
  )
  from cur, prev;
$$;

grant execute on function public.get_admin_overview() to authenticated;

-- 6. Range-scoped analytics ---------------------------------------------------
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
    select coalesce(sum(total) filter (where status <> 'cancelled'), 0) as revenue,
           count(*)                as orders,
           count(distinct coalesce(customer_email, customer_phone)) as customers
    from public.orders
    where created_at >= v_since
  ),
  prev as (
    select coalesce(sum(total) filter (where status <> 'cancelled'), 0) as revenue,
           count(*) as orders
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
           coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0) as revenue,
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
      and o.status <> 'cancelled'
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
      and o.status <> 'cancelled'
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
