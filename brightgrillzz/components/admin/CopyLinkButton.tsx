'use client'

import { useState } from 'react'
import { Check, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

/**
 * Copies a shareable public link (built from the current origin + `path`) so
 * admins can send it to customers. Used in the dashboard headers.
 */
export function CopyLinkButton({
  path,
  label = 'Copy link',
  className,
}: {
  path: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({ title: 'Link copied', description: `${url} copied to clipboard` })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy the link manually', variant: 'destructive' })
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted',
        className,
      )}
      aria-label={label}
    >
      {copied ? <Check className="h-4 w-4 text-secondary" /> : <Link2 className="h-4 w-4" />}
      {label}
    </button>
  )
}
