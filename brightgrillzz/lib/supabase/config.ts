// Central place to read the Supabase env vars. When they're absent the app
// still runs (the marketing site + the mock-data admin preview keep working), 
// auth and live queries simply stay disabled until you fill in `.env.local`.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
