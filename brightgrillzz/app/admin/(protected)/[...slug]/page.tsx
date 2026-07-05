import Link from 'next/link'
import { Construction } from 'lucide-react'

/**
 * Placeholder for admin sections that don't have a dedicated page yet.
 * Keeps the user inside the admin shell (sidebar + topbar) instead of
 * dropping them onto the site-wide 404.
 */
export default async function AdminPlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const title = (slug?.[0] ?? 'Section')
    .replace(/-/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Construction className="h-7 w-7" />
      </div>
      <h1 className="mt-5 font-headline text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This section is coming soon. The dashboard is the only page wired up for
        now — the rest of the admin is next.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
