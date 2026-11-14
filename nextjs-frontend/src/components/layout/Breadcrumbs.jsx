"use client";

import { ChevronRight } from 'lucide-react'
import { Link } from '@/lib/router-compat'
import { cn } from '../../utils/cn.js'

export function Breadcrumbs({ items = [], className }) {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex min-w-0 items-center gap-1.5 text-xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              {index > 0 && (
                <ChevronRight
                  className="size-3.5 shrink-0 text-slate-600"
                  aria-hidden="true"
                />
              )}

              {isLast || !item.to ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    'truncate',
                    isLast ? 'font-medium text-ink' : 'text-muted',
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="truncate text-muted transition-colors duration-200 hover:text-brand-300"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
