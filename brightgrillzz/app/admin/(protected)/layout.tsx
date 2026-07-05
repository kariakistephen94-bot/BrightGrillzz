import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { AdminShell, type AdminUser } from '@/components/admin/AdminShell'
import { signOut } from '../actions'

/**
 * Real authorization for the admin area (the proxy only does an optimistic
 * check). Anyone who isn't staff/admin is bounced out. When Supabase isn't
 * configured yet we fall back to a labelled preview so the UI stays viewable.
 */
export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured) {
    const previewUser: AdminUser = {
      name: 'Preview',
      email: 'connect Supabase to enable auth',
      role: 'admin',
    }
    return (
      <AdminShell user={previewUser} previewMode>
        {children}
      </AdminShell>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  // Provision the profile on first sign-in — no DB trigger. RLS only permits
  // inserting your own row as 'customer'; promotion to admin/staff is done via
  // SQL (07_promote_admin.sql). Existing rows are left untouched.
  const profileRow = {
    id: user.id,
    email: user.email ?? null,
    full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
  }
  // `as never`: supabase-js can't infer Insert types from our hand-written
  // Database types, so it collapses the argument to `never` (same reason the
  // select result below is cast).
  await supabase
    .from('profiles')
    .upsert(profileRow as never, { onConflict: 'id', ignoreDuplicates: true })

  const { data } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  const profile = data as {
    full_name: string | null
    email: string | null
    role: 'admin' | 'staff' | 'customer'
  } | null

  const role = profile?.role ?? 'customer'
  if (role !== 'admin' && role !== 'staff') {
    return <AccessDenied email={profile?.email ?? user.email ?? ''} />
  }

  const adminUser: AdminUser = {
    name: profile?.full_name || user.email?.split('@')[0] || 'Admin',
    email: profile?.email || user.email || '',
    role,
  }

  return <AdminShell user={adminUser}>{children}</AdminShell>
}

function AccessDenied({ email }: { email: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-headline text-2xl font-bold text-foreground">
          Access denied
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{email}</span> is signed
          in but doesn&rsquo;t have admin access. Ask an admin to grant your
          account the <code className="rounded bg-muted px-1 py-0.5">admin</code>{' '}
          or <code className="rounded bg-muted px-1 py-0.5">staff</code> role.
        </p>
        <form action={signOut} className="mt-6">
          <button className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
