-- ============================================================================
-- Migration: add media_assets.available_for_request
-- For databases that already ran 20260711_media_assets.sql. Safe to re-run.
--
-- available_for_request = true  → the item is shoppable (can be added to a
--   request/order from the storefront gallery + video reel).
-- available_for_request = false → display-only (a moment shown in video/photo,
--   never added to a request).
-- ============================================================================

alter table public.media_assets
  add column if not exists available_for_request boolean not null default true;
