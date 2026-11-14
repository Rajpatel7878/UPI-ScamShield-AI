"use client";

import { cn } from '../../utils/cn.js'

export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header
      className={cn(
        'flex flex-col gap-5 border-b border-white/5 pb-8 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="type-label mb-2 text-brand-300">{eyebrow}</p>}
        <h1 className="type-h1">{title}</h1>
        {description && (
          <p className="type-body mt-2 max-w-2xl text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
