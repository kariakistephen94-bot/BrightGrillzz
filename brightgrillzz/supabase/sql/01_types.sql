-- ============================================================================
-- BrightGrillzz — 01. Enum types
-- Run order: 01 → 02 → 03 → 04 → 05 → 06.  Safe to re-run (idempotent).
-- ============================================================================

do $$ begin
  create type public.user_role as enum ('customer', 'staff', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'preparing', 'ready', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fulfillment_type as enum ('delivery', 'pickup');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('bank_transfer', 'paystack');
exception when duplicate_object then null; end $$;
