"use client";

import { cn } from '../../utils/cn.js'

export function Divider({ label, className }) {
  if (!label) {
    return <hr className={cn('border-0 border-t border-white/8', className)} />
  }

  return (
    <div className={cn('flex items-center gap-3', className)} role="separator">
      <span className="h-px flex-1 bg-white/8" />
      <span className="type-label text-slate-500">{label}</span>
      <span className="h-px flex-1 bg-white/8" />
    </div>
  )
}
