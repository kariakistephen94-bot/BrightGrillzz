-- ============================================================================
-- BrightGrillzz — 03. Functions (helpers only — NO triggers)
--
-- This app intentionally avoids database triggers. Instead:
--   • updated_at is set by the application on write.
--   • the profiles row is provisioned by the app on first sign-in
--     (see the admin layout's ensureProfile) — not by an auth trigger.
--   • role escalation is blocked by RLS: a user may only insert their own
--     row as 'customer'; promotion happens via SQL / a service-role context.
-- ============================================================================

-- Clean up any triggers/functions created by earlier versions of this file ----
drop trigger if exists set_profiles_updated_at on public.profiles;
drop trigger if exists set_menu_items_updated_at on public.menu_items;
drop trigger if exists set_orders_updated_at on public.orders;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists guard_profiles_role on public.profiles;
drop function if exists public.set_updated_at();
drop function if exists public.handle_new_user();
drop function if exists public.guard_profile_role();

-- Role helpers. SECURITY DEFINER so they can read profiles without tripping
-- the profiles RLS policies (which would otherwise recurse). These are plain
-- helper functions used inside policies — not triggers. --------------------
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('staff', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Public order tracking: lets an anonymous customer look up ONE order by its
-- tracking id without exposing the whole orders table through RLS. -----------
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
    'created_at',        o.created_at,
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
