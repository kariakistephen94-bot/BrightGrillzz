'use client'

import * as React from 'react'
import { CheckCircle2, Loader2, Star } from 'lucide-react'

/**
 * Standalone review form. Same submission flow as the post-order ReviewPrompt
 * modal (anonymous, posts to /api/reviews) but laid out as a page card so
 * admins can share a direct review link with customers.
 */
export function ReviewForm({ defaultName = '' }: { defaultName?: string }) {
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
      <div className="glass-card rounded-[2rem] p-8 text-center sm:p-12">
        {rating < 4 ? (
          <>
            <div className="mb-4 text-5xl">😠</div>
            <h3 className="text-lg font-bold text-destructive">We&apos;re so sorry!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We apologize that your experience wasn&apos;t up to standard. Your feedback helps us improve.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-primary" />
            <h3 className="text-lg font-bold">Thank you for your review! 🙏</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;re so glad you enjoyed it. We hope to see you next time!
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="glass-card rounded-[2rem] p-6 sm:p-8">
      {/* Stars */}
      <div className="flex items-center justify-center gap-1.5">
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
              className={`h-9 w-9 transition-colors ${
                s <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/40'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Tell us what you loved…"
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="sheen press mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-secondary to-[#9e1730] text-base font-semibold text-white shadow-xl shadow-secondary/25 disabled:opacity-70"
      >
        {status === 'sending' && <Loader2 className="h-5 w-5 animate-spin" />}
        Submit review
      </button>
    </form>
  )
}
