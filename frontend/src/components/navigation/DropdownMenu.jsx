import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/cn.js'

/**
 * Trigger + menu. Closes on outside pointerdown and Escape, returning focus to
 * the trigger. `items` entries: { label, icon, onSelect, variant }.
 */
export function DropdownMenu({
  label,
  trigger,
  items = [],
  align = 'right',
  className,
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
          role="menu"
          aria-label={label}
          className={cn(
            'absolute z-30 mt-2 w-56 origin-top rounded-xl border border-navy-700 bg-navy-800 p-1.5 shadow-lift animate-fade-up',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          {items.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  item.onSelect?.()
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150',
                  item.variant === 'danger'
                    ? 'text-danger-400 hover:bg-danger-500/10'
                    : 'text-slate-300 hover:bg-white/5 hover:text-ink',
                )}
              >
                {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
