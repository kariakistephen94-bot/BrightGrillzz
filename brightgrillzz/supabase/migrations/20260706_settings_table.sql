-- Migration: settings singleton table
-- Run this once in Supabase → SQL Editor (or via supabase db push)

create table if not exists settings (
  id                      int primary key default 1 check (id = 1), -- singleton
  name                    text,
  tagline                 text,
  phone                   text,
  email                   text,
  address                 text,
  hours                   text,
  bank                    text,
  account_number          text,
  account_name            text,
  accept_online_payments  boolean default true,
  notify_new_order        boolean default true,
  notify_reservation      boolean default true,
  notify_daily_summary    boolean default false,
  notify_low_rating       boolean default true,
  notification_email      text,
  updated_at              timestamptz default now()
);

-- Seed with current hard-coded defaults so the page always has values.
insert into settings (
  id, name, tagline, phone, email, address, hours,
  bank, account_number, account_name, notification_email
) values (
  1,
  'BrightGrillzz',
  'Premium BBQ',
  '0818 107 0919',
  'Brightgrillzzglobal@gmail.com',
  '5 Madiana Close, Wuse 2, Abuja, Nigeria',
  'Open 24/7',
  'UBA',
  '1028930153',
  'Brightgrillzz Global Ltd',
  'Brightgrillzzglobal@gmail.com'
) on conflict (id) do nothing;

-- RLS: any authenticated staff/admin may read and update the row.
alter table settings enable row level security;

drop policy if exists "staff_read_settings" on settings;
create policy "staff_read_settings"
  on settings for select
  using (public.is_staff());

drop policy if exists "staff_write_settings" on settings;
create policy "staff_write_settings"
  on settings for update
  using (public.is_staff())
  with check (public.is_staff());

-- upsert needs an insert policy too (fires when the row is absent).
drop policy if exists "staff_insert_settings" on settings;
create policy "staff_insert_settings"
  on settings for insert
  with check (public.is_staff());
