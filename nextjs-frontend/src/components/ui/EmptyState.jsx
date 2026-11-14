"use client";

import { Inbox } from 'lucide-react'
import { cn } from '../../utils/cn.js'

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center',
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/[0.03] text-slate-500 ring-1 ring-white/10">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      {description && <p className="type-body-sm mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
