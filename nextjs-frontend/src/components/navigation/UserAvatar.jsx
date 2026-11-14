"use client";

import Image from 'next/image'

import { cn } from '../../utils/cn.js'

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
}

const STATUS = {
  online: 'bg-success-400',
  away: 'bg-warning-400',
  offline: 'bg-slate-500',
}

function initialsFrom(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function UserAvatar({ name = 'Guest user', src, size = 'md', status, className }) {
  const badgeSize = size === 'sm' ? 'size-2' : 'size-2.5'

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <Image
          src={src}
          alt={name}
          width={48}
          height={48}
          unoptimized
          className={cn(
            'rounded-full border border-white/10 object-cover',
            SIZES[size] ?? SIZES.md,
          )}
        />
      ) : (
        <span
          role="img"
          aria-label={name}
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-navy-700 font-semibold text-brand-200 ring-1 ring-white/10',
            SIZES[size] ?? SIZES.md,
          )}
        >
          {initialsFrom(name)}
        </span>
      )}
      {status && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-navy-950',
            badgeSize,
            STATUS[status] ?? STATUS.offline,
          )}
        />
      )}
    </span>
  )
}
