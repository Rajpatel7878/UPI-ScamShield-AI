"use client";

import { cn } from '../../utils/cn.js'

export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className,
}) {
  const centered = align === 'center'

  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        centered
          ? 'items-center text-center'
          : 'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn('min-w-0', centered && 'flex flex-col items-center')}>
        {eyebrow && <p className="type-label mb-2 text-brand-300">{eyebrow}</p>}
        <h2 id={id} className="type-h2 scroll-mt-24">
          {title}
        </h2>
        {description && (
          <p className="type-body-sm mt-2 max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="mt-2 shrink-0 sm:mt-0">{action}</div>}
    </div>
  )
}
