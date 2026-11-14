"use client";

import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from '@/lib/router-compat'
import { cn } from '../../utils/cn.js'

/**
 * Trigger + menu. Closes on outside pointerdown and Escape, returning focus to
 * the trigger. `items` entries: { label, icon, onSelect, variant, to, disabled,
 * hint }. Pass `panel` instead of items to render custom menu content, such as
 * the notification empty state.
 */
export function DropdownMenu({
  label,
  trigger,
  items = [],
  align = 'right',
  width = 'w-56',
  className,
  menuClassName,
  panel,
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
      >
        {trigger ?? (
          <>
            <span>{label}</span>
            <ChevronDown
              className={cn('size-4 transition-transform duration-200', open && 'rotate-180')}
              aria-hidden="true"
            />
          </>
        )}
      </button>

      {open && (
        <div
          role={panel ? 'dialog' : 'menu'}
          aria-label={label}
          className={cn(
            'absolute z-30 mt-2 origin-top rounded-xl border border-navy-700 bg-navy-800 p-1.5 shadow-lift animate-fade-up',
            width,
            align === 'left' ? 'left-0' : 'right-0',
            menuClassName,
          )}
        >
          {panel ??
            items.map((item) => {
              const Icon = item.icon
              const itemClassName = cn(
                'flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150',
                item.disabled
                  ? 'cursor-not-allowed text-slate-500'
                  : item.variant === 'danger'
                    ? 'text-danger-400 hover:bg-danger-500/10'
                    : 'text-slate-300 hover:bg-white/5 hover:text-ink',
              )

              const content = (
                <>
                  {Icon && (
                    <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block">{item.label}</span>
                    {item.hint && (
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                        {item.hint}
                      </span>
                    )}
                  </span>
                  {item.disabled && (
                    <span className="mt-0.5 shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Soon
                    </span>
                  )}
                </>
              )

              if (item.to && !item.disabled) {
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={itemClassName}
                  >
                    {content}
                  </Link>
                )
              }

              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  aria-disabled={item.disabled || undefined}
                  onClick={() => {
                    if (item.disabled) return
                    setOpen(false)
                    item.onSelect?.()
                  }}
                  className={itemClassName}
                >
                  {content}
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
