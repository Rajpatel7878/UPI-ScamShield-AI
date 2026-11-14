"use client";

import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const SIZES = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
}

export function LoadingSpinner({
  size = 'md',
  label = 'Loading',
  hideLabel = false,
  className,
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-2', className)}
    >
      <Loader2
        className={cn('animate-spin text-brand-400', SIZES[size])}
        aria-hidden="true"
      />
      <span className={hideLabel ? 'sr-only' : 'text-sm text-muted'}>{label}</span>
    </span>
  )
}
