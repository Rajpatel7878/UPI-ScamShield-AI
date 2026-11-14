"use client";

import { NavLink as RouterNavLink } from '@/lib/router-compat'
import { cn } from '../../utils/cn.js'

export function NavLink({ to, end = false, icon: Icon, className, children }) {
  return (
    <RouterNavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
          isActive
            ? 'bg-brand-500/10 text-brand-300'
            : 'text-muted hover:bg-white/5 hover:text-ink',
          className,
        )
      }
    >
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {children}
    </RouterNavLink>
  )
}
