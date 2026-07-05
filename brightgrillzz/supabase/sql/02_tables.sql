-- ============================================================================
-- BrightGrillzz — 02. Tables & indexes
-- All monetary values are stored as INTEGER naira (no kobo/decimals).
-- ============================================================================

-- Profiles: one row per auth.users, holds role + display name -----------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Menu categories (marketing sections / grouping) ----------------------------
create table if not exists public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  description text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- Menu items -----------------------------------------------------------------
create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique,
  description  text,
  price        integer not null default 0,   -- unit price in naira
  price_label  text,                          -- human range e.g. "₦18,000 – ₦25,000"
  rating       numeric(2,1) not null default 0,
  category     text,                          -- kept as text to match storefront copy
  category_id  uuid references public.menu_categories (id) on delete set null,
  image        text,
  badge        text,
  is_available boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Orders ---------------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  tracking_id       text unique not null,
  status            public.order_status not null default 'pending',
  customer_id       uuid references public.profiles (id) on delete set null,
  customer_name     text not null,
  customer_phone    text not null,
  customer_email    text,
  fulfillment_type  public.fulfillment_type not null default 'delivery',
  address           text,
  area              text,
  notes             text,
  subtotal          integer not null default 0,
  total             integer not null default 0,
  payment_method    public.payment_method not null default 'bank_transfer',
  payment_reference text,
  payment_confirmed boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Order line items -----------------------------------------------------------
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  menu_item_id  uuid references public.menu_items (id) on delete set null,
  name          text not null,
  unit_price    integer not null default 0,
  qty           integer not null default 1 check (qty > 0),
  image         text,
  line_total    integer generated always as (unit_price * qty) stored,
  created_at    timestamptz not null default now()
);

-- Customer reviews -----------------------------------------------------------
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  author       text not null,
  role         text,
  comment      text not null,
  rating       int not null default 5 check (rating between 1 and 5),
  source       text default 'google',
  is_published boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- Contact form submissions ---------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes --------------------------------------------------------------------
create index if not exists orders_created_at_idx   on public.orders (created_at desc);
create index if not exists orders_status_idx       on public.orders (status);
create index if not exists orders_customer_idx      on public.orders (customer_id);
create index if not exists order_items_order_idx    on public.order_items (order_id);
create index if not exists menu_items_category_idx  on public.menu_items (category);
create index if not exists menu_items_available_idx on public.menu_items (is_available);

-- Enable Row Level Security immediately, so no table is ever exposed to the
-- anon/authenticated keys. With RLS on and no policies yet, all client access
-- is denied — the actual policies are added in 04_policies.sql.
alter table public.profiles         enable row level security;
alter table public.menu_categories  enable row level security;
alter table public.menu_items       enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.reviews          enable row level security;
alter table public.contact_messages enable row level security;
