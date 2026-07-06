'use client'

import * as React from 'react'
import { Loader2, MessageCircle, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNaira } from '@/lib/format'
import { getQuoteDraft, saveQuote, sendOrderQuote, type QuoteDraft } from '@/app/admin/(protected)/quote-actions'

export function QuoteDialog({ dbId, onClose }: { dbId: string; onClose: () => void }) {
  const [draft, setDraft] = React.useState<QuoteDraft | null>(null)
  const [prices, setPrices] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [note, setNote] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ ok: boolean; text: string } | null>(null)
  const [whatsappUrl, setWhatsappUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    getQuoteDraft(dbId).then((d) => {
      if (!active) return
      setDraft(d)
      setPrices(Object.fromEntries(d.lines.map((l) => [l.orderItemId, l.suggested ? String(l.suggested) : ''])))
      setSaved(d.status === 'quoted')
    })
    return () => {
      active = false
    }
  }, [dbId])

  const total = React.useMemo(
    () => (draft?.lines ?? []).reduce((sum, l) => sum + (Number(prices[l.orderItemId]) || 0) * l.qty, 0),
    [draft, prices],
  )

  const handleSave = async () => {
    if (!draft) return
    setSaving(true)
    setFeedback(null)
    const res = await saveQuote(
      dbId,
      draft.lines.map((l) => ({ orderItemId: l.orderItemId, menuItemId: l.menuItemId, unitPrice: Number(prices[l.orderItemId]) || 0 })),
    )
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setFeedback({ ok: true, text: `Quote saved: ${formatNaira(res.total)}. You can send it now.` })
    } else {
      setFeedback({ ok: false, text: res.error })
    }
  }

  const handleSend = async () => {
    setSending(true)
    setFeedback(null)
    const res = await sendOrderQuote(dbId, note.trim() || undefined)
    setSending(false)
    if (res.ok) {
      setWhatsappUrl(res.whatsappUrl)
      setFeedback({
        ok: true,
        text: res.emailed ? 'Quote emailed. Open WhatsApp to send it there too.' : 'Ready. Open WhatsApp to send the quote (no email on file).',
      })
    } else {
      setFeedback({ ok: false, text: res.error })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Quote request</h3>
            {draft && <p className="text-xs text-muted-foreground">#{draft.trackingId} · {draft.customerName}</p>}
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!draft ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-2">
              {draft.lines.map((l) => (
                <div key={l.orderItemId} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                  <span className="inline-flex h-6 min-w-[1.75rem] shrink-0 items-center justify-center rounded-md bg-muted px-1.5 text-xs font-semibold tabular-nums text-foreground">
                    {l.qty}×
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{l.name}</p>
                    {l.lockedToday && <p className="text-[0.7rem] text-success">Today&apos;s locked price</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground">₦</span>
                    <input
                      type="number"
                      min={0}
                      value={prices[l.orderItemId] ?? ''}
                      onChange={(e) => { setPrices((p) => ({ ...p, [l.orderItemId]: e.target.value })); setSaved(false) }}
                      placeholder="0"
                      className="h-9 w-24 rounded-lg border border-border bg-card px-2 text-right text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                    <span className="hidden w-20 text-right text-xs text-muted-foreground sm:inline">
                      {formatNaira((Number(prices[l.orderItemId]) || 0) * l.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold tabular-nums text-primary">{formatNaira(total)}</span>
            </div>

            {feedback && <p className={cn('mt-3 text-sm', feedback.ok ? 'text-success' : 'text-destructive')}>{feedback.text}</p>}

            <button
              onClick={handleSave}
              disabled={saving || total <= 0}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saved ? 'Update quote' : 'Save quote'}
            </button>

            {saved && (
              <div className="mt-5 border-t border-border pt-4">
                <label className="text-xs font-medium text-muted-foreground">Optional note to the customer</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Price holds for today. Let us know to lock your date."
                  className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send quote (email)
                  </button>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-[#052e16]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Open WhatsApp
                    </a>
                  )}
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Email includes a Paystack pay link (if configured) and your bank details.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
