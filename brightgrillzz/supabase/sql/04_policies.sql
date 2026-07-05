-- ============================================================================
-- BrightGrillzz — 04. Row Level Security
-- Model:
--   • anon (public storefront)  → read menu + published reviews, place orders,
--                                 send contact messages
--   • staff / admin             → full read/write on operational tables
--   • every user                → read/update their own profile
-- ============================================================================

alter table public.profiles         enable row level security;
alter table public.menu_categories  enable row level security;
alter table public.menu_items       enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.reviews          enable row level security;
alter table public.contact_messages enable row level security;

-- ---------- profiles --------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() = id or public.is_staff());

-- A signed-in user may create ONLY their own row, and only as a 'customer'.
-- This is how the app provisions a profile on first sign-in without any auth
-- trigger, while making self-promotion to admin impossible. Role changes are
-- done via SQL (07_promote_admin.sql) or a service-role context.
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert with check (auth.uid() = id and role = 'customer');

-- Admins manage all profiles (including roles).
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Old self-update policy is intentionally removed (it allowed self role edits).
drop policy if exists profiles_update on public.profiles;

-- ---------- menu_categories -------------------------------------------------
drop policy if exists menu_categories_read on public.menu_categories;
create policy menu_categories_read on public.menu_categories
  for select using (true);

drop policy if exists menu_categories_write on public.menu_categories;
create policy menu_categories_write on public.menu_categories
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- menu_items ------------------------------------------------------
drop policy if exists menu_items_read on public.menu_items;
create policy menu_items_read on public.menu_items
  for select using (is_available or public.is_staff());

drop policy if exists menu_items_write on public.menu_items;
create policy menu_items_write on public.menu_items
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- orders ----------------------------------------------------------
-- Anyone can place an order (guest checkout).
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders
  for insert with check (true);

-- Staff read all; a signed-in customer can read their own linked orders.
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select using (public.is_staff() or customer_id = auth.uid());

drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists orders_delete on public.orders;
create policy orders_delete on public.orders
  for delete using (public.is_staff());

-- ---------- order_items -----------------------------------------------------
drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items
  for insert with check (true);

drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.customer_id = auth.uid()
    )
  );

drop policy if exists order_items_write on public.order_items;
create policy order_items_write on public.order_items
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- reviews ---------------------------------------------------------
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews
  for select using (is_published or public.is_staff());

drop policy if exists reviews_write on public.reviews;
create policy reviews_write on public.reviews
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- contact_messages ------------------------------------------------
drop policy if exists contact_insert on public.contact_messages;
create policy contact_insert on public.contact_messages
  for insert with check (true);

drop policy if exists contact_staff_read on public.contact_messages;
create policy contact_staff_read on public.contact_messages
  for select using (public.is_staff());

drop policy if exists contact_staff_write on public.contact_messages;
create policy contact_staff_write on public.contact_messages
  for all using (public.is_staff()) with check (public.is_staff());
