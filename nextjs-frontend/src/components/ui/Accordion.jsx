"use client";

import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn.js'

/** Accessible disclosure row. Open state is controlled by the parent. */
export function AccordionItem({
  id,
  title,
  meta,
  isOpen = false,
  onToggle,
  children,
  className,
}) {
  const buttonId = `${id}-button`
  const panelId = `${id}-panel`

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]',
        isOpen && 'border-brand-500/30',
        className,
      )}
    >
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => onToggle?.(id)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] sm:px-6"
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">{title}</span>
            {meta && <span className="type-body-sm mt-1 block">{meta}</span>}
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-slate-500 transition-transform duration-200',
              isOpen && 'rotate-180 text-brand-300',
            )}
            aria-hidden="true"
          />
        </button>
      </h3>

      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="animate-fade-in border-t border-white/5 px-5 py-4 sm:px-6"
        >
          {children}
        </div>
      )}
    </div>
  )
}
