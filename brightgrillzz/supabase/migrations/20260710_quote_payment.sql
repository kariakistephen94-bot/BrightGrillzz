-- ============================================================================
-- Migration: customer-facing quote payment (tracking page)
-- Run once in Supabase (SQL Editor or `supabase db push`). Safe to re-run.
--
-- After admin quotes a request, the customer sees the price on their tracking
-- page and can either pay online (Paystack link) or report a bank transfer.
-- ============================================================================

-- 1. Payment link + "customer says paid" flag on the order.
alter table public.orders add column if not exists pay_url text;
alter table public.orders add column if not exists pay_reference text;
alter table public.orders add column if not exists customer_paid_notice boolean not null default false;
alter table public.orders add column if not exists customer_paid_notice_at timestamptz;

-- 2. Tracking read now also exposes the pay link + the paid-notice flag.
create or replace function public.get_order_by_tracking(p_tracking_id text)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select case when o.id is null then null else jsonb_build_object(
    'tracking_id',          o.tracking_id,
    'status',               o.status,
    'fulfillment_type',     o.fulfillment_type,
    'area',                 o.area,
    'subtotal',             o.subtotal,
    'total',                o.total,
    'payment_method',       o.payment_method,
    'payment_confirmed',    o.payment_confirmed,
    'pay_url',              o.pay_url,
    'customer_paid_notice', o.customer_paid_notice,
    'cancellation_note',    o.cancellation_note,
    'rider_number',         o.rider_number,
    'out_for_delivery_at',  o.out_for_delivery_at,
    'created_at',           o.created_at,
    'updated_at',           o.updated_at,
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

-- 3. Customer reports a bank transfer. SECURITY DEFINER so an anonymous customer
--    can flag their own quoted order as paid (pending admin confirmation) without
--    any table write access. Only touches a quoted/pending, unconfirmed order.
create or replace function public.mark_bank_payment_notice(p_tracking_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.orders;
begin
  update public.orders
     set customer_paid_notice = true,
         customer_paid_notice_at = now(),
         payment_method = 'bank_transfer',
         updated_at = now()
   where upper(tracking_id) = upper(trim(p_tracking_id))
     and status in ('quoted', 'pending')
     and payment_confirmed = false
  returning * into updated;

  if updated.id is null then
    return null;
  end if;
  return jsonb_build_object('tracking_id', updated.tracking_id, 'customer_paid_notice', updated.customer_paid_notice);
end;
$$;

grant execute on function public.mark_bank_payment_notice(text) to anon, authenticated;
