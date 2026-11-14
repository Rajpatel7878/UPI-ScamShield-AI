"use client";

import { ShieldCheck } from 'lucide-react'
import { Link } from '@/lib/router-compat'
import { APP_NAME, APP_TAGLINE } from '../../utils/constants.js'
import { cn } from '../../utils/cn.js'

const SIZES = {
  sm: { mark: 'size-8 rounded-lg', icon: 'size-4', name: 'text-sm', tagline: 'text-[10px]' },
  md: { mark: 'size-10 rounded-xl', icon: 'size-5', name: 'text-sm sm:text-base', tagline: 'text-[11px]' },
  lg: { mark: 'size-14 rounded-2xl', icon: 'size-7', name: 'text-lg sm:text-xl', tagline: 'text-xs' },
}

/**
 * Brand lockup: shield mark plus wordmark. Renders as a router link by default;
 * pass `asLink={false}` when it is used inside another interactive element.
 */
export function BrandLogo({
  size = 'md',
  showTagline = true,
  asLink = true,
  to = '/',
  compact = false,
  className,
}) {
  const scale = SIZES[size] ?? SIZES.md

  const mark = (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-linear-to-br from-brand-400 to-brand-600 text-navy-950 shadow-lg shadow-brand-500/25',
        scale.mark,
      )}
      aria-hidden="true"
    >
      <ShieldCheck className={scale.icon} strokeWidth={2.2} />
    </span>
  )

  const content = compact ? (
    mark
  ) : (
    <>
      {mark}
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={cn(
            'whitespace-nowrap font-semibold tracking-tight text-ink',
            scale.name,
          )}
        >
          {APP_NAME}
        </span>
        {showTagline && (
          <span className={cn('text-brand-300/80', scale.tagline)}>{APP_TAGLINE}</span>
        )}
      </span>
    </>
  )

  const classes = cn('inline-flex items-center gap-3', className)

  if (!asLink) {
    return <span className={classes}>{content}</span>
  }

  return (
    <Link
      to={to}
      aria-label={`${APP_NAME} — home`}
      className={cn(classes, 'rounded-lg transition-opacity duration-200 hover:opacity-85')}
    >
      {content}
    </Link>
  )
}
