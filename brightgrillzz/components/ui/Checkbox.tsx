'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}

/** Minimal controlled checkbox with a Radix-style `onCheckedChange` API. */
export function Checkbox({ id, checked = false, onCheckedChange, className }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      id={id}
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'h-5 w-5 shrink-0 rounded-md border border-input flex items-center justify-center transition-colors',
        checked ? 'bg-primary border-primary text-primary-foreground' : 'bg-background',
        className,
      )}
    >
      {checked && <Check className="h-3.5 w-3.5" />}
    </button>
  )
}
