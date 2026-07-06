-- ============================================================================
-- BrightGrillzz — 09a. Delivery enum value (RUN THIS ALONE, BEFORE 09)
-- ----------------------------------------------------------------------------
-- Postgres forbids adding a new enum value and USING it in the same
-- transaction ("unsafe use of new value ... must be committed before they can
-- be used"). The Supabase SQL editor runs each script as one transaction, so
-- the enum add must be committed on its own run before 09_delivery.sql (whose
-- function bodies reference 'out_for_delivery') can be applied.
--
-- Run order:  08_order_ops.sql  →  09a_delivery_enum.sql  →  09_delivery.sql
-- Idempotent — safe to re-run.
-- ============================================================================

alter type public.order_status add value if not exists 'out_for_delivery';
