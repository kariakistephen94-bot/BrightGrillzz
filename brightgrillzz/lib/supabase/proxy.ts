import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

/**
 * Refreshes the Supabase auth session on every request and does an *optimistic*
 * gate on /admin (a real role check still happens in the admin layout, see
 * the Next.js auth guide: proxy is for optimistic checks only).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Without Supabase configured, don't touch anything, site stays usable.
  if (!isSupabaseConfigured) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  // IMPORTANT: getUser() revalidates the token and refreshes cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAdminArea = pathname.startsWith('/admin')
  const isLogin = pathname === '/admin/login'

  if (isAdminArea && !isLogin && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return response
}
