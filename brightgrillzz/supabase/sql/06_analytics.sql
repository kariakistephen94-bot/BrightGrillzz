-- ============================================================================
-- BrightGrillzz — 06. Dashboard analytics (views + overview RPC)
-- Every object uses security_invoker so the caller's RLS applies: only
-- staff/admin can read real figures, anon sees nothing.
-- ============================================================================

-- Revenue & orders per week, last 12 weeks -----------------------------------
create or replace view public.admin_revenue_by_week
with (security_invoker = on) as
select
  date_trunc('week', created_at)::date as week_start,
  count(*)                              as orders,
  coalesce(sum(total), 0)              as revenue
from public.orders
where created_at >= date_trunc('week', now()) - interval '11 weeks'
group by 1
order by 1;

-- Orders per weekday ---------------------------------------------------------
create or replace view public.admin_orders_by_weekday
with (security_invoker = on) as
select
  extract(isodow from created_at)::int as iso_dow,        -- 1=Mon … 7=Sun
  to_char(created_at, 'Dy')            as day,
  count(*)                             as orders
from public.orders
group by 1, 2
order by 1;

-- Sales share by category ----------------------------------------------------
create or replace view public.admin_sales_by_category
with (security_invoker = on) as
select
  coalesce(mi.category, 'Other')      as category,
  count(*)                            as items_sold,
  coalesce(sum(oi.line_total), 0)     as revenue
from public.order_items oi
left join public.menu_items mi on mi.id = oi.menu_item_id
group by 1
order by revenue desc;

-- Top selling items ----------------------------------------------------------
create or replace view public.admin_top_items
with (security_invoker = on) as
select
  oi.name,
  sum(oi.qty)         as orders,
  sum(oi.line_total)  as revenue
from public.order_items oi
group by oi.name
order by orders desc
limit 10;

grant select on
  public.admin_revenue_by_week,
  public.admin_orders_by_weekday,
  public.admin_sales_by_category,
  public.admin_top_items
to authenticated;

-- Single-call KPI summary with 30-day deltas ---------------------------------
create or replace function public.get_admin_overview()
returns jsonb
language sql
security invoker
stable
set search_path = public
as $$
  with cur as (
    select coalesce(sum(total), 0) as revenue, count(*) as orders,
           count(distinct customer_email) as customers
    from public.orders
    where created_at >= now() - interval '30 days'
  ),
  prev as (
    select coalesce(sum(total), 0) as revenue, count(*) as orders
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
