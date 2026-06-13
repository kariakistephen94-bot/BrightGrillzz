'use client'

import { useEffect, useState } from 'react'

export interface Toast {
  id: number
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

type ToastInput = Omit<Toast, 'id'>

// Tiny global store so `toast()` can be called from anywhere (mirrors the
// GrillsJunction API: `const { toast } = useToast()`).
let toasts: Toast[] = []
const listeners = new Set<(t: Toast[]) => void>()
let counter = 0

function emit() {
  listeners.forEach((l) => l(toasts))
}

export function toast(input: ToastInput) {
  const id = ++counter
  toasts = [...toasts, { id, ...input }]
  emit()
  setTimeout(() => dismiss(id), 3200)
  return id
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts)

  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  return { toasts: state, toast, dismiss }
}
