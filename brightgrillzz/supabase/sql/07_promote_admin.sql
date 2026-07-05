-- ============================================================================
-- BrightGrillzz — 07. Promote a user to admin  (run LAST, and edit the email)
--
-- How to create your first admin:
--   1. Start the app and open /admin/login, then use "Create an account" to
--      sign up  (or add the user in Supabase → Authentication → Users).
--   2. Sign in once. On first sign-in the app creates a public.profiles row
--      with role 'customer' (no trigger). Replace the email below with that
--      user's email and run this.
-- ============================================================================

update public.profiles
set role = 'admin'
where email = 'you@example.com';   -- <-- CHANGE THIS

-- Verify:
-- select id, email, role from public.profiles order by created_at desc;
