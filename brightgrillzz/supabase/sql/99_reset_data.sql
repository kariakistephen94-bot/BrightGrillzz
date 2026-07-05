-- ============================================================================
-- BrightGrillzz — 99. Reset data for a clean production start
--
-- Run this in the Supabase SQL Editor when you want to wipe test data.
-- It does NOT touch the schema, policies, admin accounts, or the menu catalog.
-- ============================================================================

-- 1) DEFAULT: clear transactional / test data only ---------------------------
--    Keeps: menu_items, menu_categories, reviews (real catalog + reviews)
--    Keeps: profiles (so your admin account keeps its access!)
truncate table public.order_items  restart identity cascade;
truncate table public.orders       restart identity cascade;
truncate table public.contact_messages restart identity cascade;

-- 2) OPTIONAL: also clear reviews (uncomment if the seeded reviews are dummy)
-- truncate table public.reviews restart identity cascade;

-- 3) OPTIONAL — FULL WIPE including the menu catalog. Only use this if you plan
--    to re-enter the whole menu from scratch (uncomment to run):
-- truncate table public.order_items, public.orders, public.contact_messages,
--                public.reviews, public.menu_items, public.menu_categories
--                restart identity cascade;

-- Note: customer/admin logins live in auth.users (Supabase → Authentication →
-- Users). Deleting a user there also removes their public.profiles row via the
-- ON DELETE CASCADE. Don't delete your own admin user.
