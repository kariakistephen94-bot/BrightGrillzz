'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 left-4 sm:left-auto z-[100] flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className={cn(
              'pointer-events-auto w-full sm:w-80 glass rounded-2xl px-4 py-3 flex items-start gap-3 shadow-premium-sm',
              t.variant === 'destructive' && 'border-destructive/40',
            )}
          >
            <div
              className={cn(
                'mt-0.5 shrink-0',
                t.variant === 'destructive' ? 'text-destructive' : 'text-secondary',
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              {t.title && <p className="font-bold text-sm text-foreground">{t.title}</p>}
              {t.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
