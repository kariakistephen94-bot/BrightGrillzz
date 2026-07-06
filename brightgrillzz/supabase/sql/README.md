# BrightGrillzz, Supabase SQL

Copy-and-paste these into the **Supabase SQL Editor** (Dashboard → SQL Editor →
New query) and run them **in order**. Each file is idempotent, so re-running is
safe.

| # | File | What it does |
|---|------|--------------|
| 1 | `01_types.sql` | Enum types (roles, order status, etc.) |
| 2 | `02_tables.sql` | Tables + indexes (profiles, menu, orders, reviews, contact) |
| 3 | `03_functions.sql` | Helper functions only, `is_admin()`/`is_staff()` + public order-tracking RPC (no triggers) |
| 4 | `04_policies.sql` | Row Level Security policies |
| 5 | `05_seed.sql` | Seeds the menu, categories and reviews |
| 6 | `06_analytics.sql` | Dashboard views + `get_admin_overview()` |
| 7 | `07_promote_admin.sql` | Makes a user an admin (edit the email first) |
| 8 | `08_order_ops.sql` | Cancellation note column, updated tracking RPC, range-aware `get_admin_analytics()` |
| 9 | `09_delivery.sql` | `out_for_delivery` status, rider number, customer `confirm_delivery()` + 24h auto-complete |

You can also paste all nine back-to-back in one query, they're ordered to
run top to bottom.

## Get your keys

Supabase → **Project Settings → API**. Put these in `.env.local`
(see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only, never exposed
```

## Create the first admin

1. Run files 1–6.
2. Start the app, open **`/admin/login`**, and sign up (or add the user under
   Supabase → Authentication → Users).
3. **Sign in once.** On first sign-in the app creates your `profiles` row with
   role `customer` (no database trigger, the app does this). You'll land on an
   "access denied" screen, which is expected until you're promoted.
4. Edit the email in `07_promote_admin.sql` and run it to grant `admin`.
5. Refresh `/admin`, you now have access to the dashboard.

## Security model

- **Public (anon):** read available menu items + published reviews, place
  orders, submit contact messages, and track a single order by id via the
  `get_order_by_tracking()` function.
- **staff / admin:** full read/write on operational tables + analytics.
- **Every signed-in user:** reads only their own profile, and may create their
  own row only as `customer`. There are **no database triggers**, the app
  provisions the profile on first sign-in, and self-promotion is blocked by RLS
  (role changes happen via SQL or a service-role context).
