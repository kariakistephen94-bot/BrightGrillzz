'use client'

import * as React from 'react'
import { CheckCircle2, Loader2, Star } from 'lucide-react'

/** Post-order review prompt. Anonymous — no login required. */
export function ReviewPrompt({ defaultName = '' }: { defaultName?: string }) {
  const [name, setName] = React.useState(defaultName)
  const [rating, setRating] = React.useState(0)
  const [hover, setHover] = React.useState(0)
  const [comment, setComment] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = React.useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!rating) return setError('Please pick a star rating.')
    if (!name.trim() || !comment.trim()) return setError('Add your name and a short comment.')

    setStatus('sending')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: name.trim(), rating, comment: comment.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed')
      setStatus('done')
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Could not send your review.')
    }
  }

  if (status === 'done') {
    return (
      <div className="mt-8 glass-card rounded-[2rem] p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h3 className="text-lg font-bold">Thank you for your review! 🙏</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We&rsquo;ve received it and it&rsquo;ll appear on our site once approved.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 glass-card rounded-[2rem] p-6">
      <h3 className="text-lg font-bold">Enjoyed your order? Leave a review</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Your feedback helps other food lovers — it only takes a moment.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        {/* Stars */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${s} star${s > 1 ? 's' : ''}`}
              className="p-0.5"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  s <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/40'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Tell us what you loved…"
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit review
        </button>
      </form>
    </div>
  )
}
