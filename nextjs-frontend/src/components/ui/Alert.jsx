"use client";

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const TONES = {
  success: {
    icon: CheckCircle2,
    role: 'status',
    className: 'border-success-500/25 bg-success-500/5',
    iconClass: 'text-success-400',
    titleClass: 'text-success-400',
  },
  warning: {
    icon: AlertTriangle,
    role: 'alert',
    className: 'border-warning-500/25 bg-warning-500/5',
    iconClass: 'text-warning-400',
    titleClass: 'text-warning-400',
  },
  info: {
    icon: Info,
    role: 'status',
    className: 'border-brand-500/25 bg-brand-500/5',
    iconClass: 'text-brand-300',
    titleClass: 'text-brand-300',
  },
}

export function Alert({ tone = 'info', title, className, children }) {
  const style = TONES[tone] ?? TONES.info
  const Icon = style.icon

  return (
    <div
      role={style.role}
      className={cn('flex gap-3 rounded-xl border p-4', style.className, className)}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', style.iconClass)} aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className={cn('text-sm font-medium', style.titleClass)}>{title}</p>}
        {children && (
          <div className={cn('type-body-sm text-slate-300', title && 'mt-1')}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export function SuccessAlert({ title = 'Success', ...props }) {
  return <Alert tone="success" title={title} {...props} />
}

export function WarningAlert({ title = 'Heads up', ...props }) {
  return <Alert tone="warning" title={title} {...props} />
}
