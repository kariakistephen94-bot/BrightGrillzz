import { cn } from '@/lib/utils'

type Blob = {
  color: string
  size: string
  top?: string
  left?: string
  right?: string
  bottom?: string
  opacity?: number
  delay?: string
}

/** Decorative ambient brand-coloured glow field. Purely presentational. */
export function Aurora({
  className,
  blobs,
}: {
  className?: string
  blobs?: Blob[]
}) {
  const items: Blob[] =
    blobs ?? [
      { color: 'var(--color-primary)', size: '34rem', top: '-10rem', left: '-8rem', opacity: 0.4 },
      { color: 'var(--color-secondary)', size: '28rem', bottom: '-8rem', right: '-6rem', opacity: 0.32, delay: '-6s' },
      { color: '#d9a441', size: '22rem', top: '25%', right: '18%', opacity: 0.22, delay: '-12s' },
    ]
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {items.map((b, i) => (
        <span
          key={i}
          className="aurora-blob animate-aurora"
          style={{
            background: b.color,
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
            opacity: b.opacity ?? 0.4,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  )
}
