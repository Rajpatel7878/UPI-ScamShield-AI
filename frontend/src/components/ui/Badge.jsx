import { cn } from '../../utils/cn.js'

const BADGE_BASE =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset'

const STATUS_STYLES = {
  online: {
    label: 'Online',
    className: 'bg-success-500/10 text-success-400 ring-success-500/25',
    dot: 'bg-success-400',
  },
  checking: {
    label: 'Checking',
    className: 'bg-warning-500/10 text-warning-400 ring-warning-500/25',
    dot: 'bg-warning-400 animate-pulse',
  },
  offline: {
    label: 'Offline',
    className: 'bg-danger-500/10 text-danger-400 ring-danger-500/25',
    dot: 'bg-danger-400',
  },
  neutral: {
    label: 'Unknown',
    className: 'bg-white/5 text-muted ring-white/10',
    dot: 'bg-slate-500',
  },
}

export function StatusBadge({ status = 'online', children, className }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.neutral

  return (
    <span className={cn(BADGE_BASE, style.className, className)}>
      <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden="true" />
      {children ?? style.label}
    </span>
  )
}

const RISK_STYLES = {
  low: {
    label: 'Low risk',
    className: 'bg-success-500/10 text-success-400 ring-success-500/25',
    dot: 'bg-success-400',
  },
  medium: {
    label: 'Medium risk',
    className: 'bg-warning-500/10 text-warning-400 ring-warning-500/25',
    dot: 'bg-warning-400',
  },
  high: {
    label: 'High risk',
    className: 'bg-danger-500/10 text-danger-400 ring-danger-500/25',
    dot: 'bg-danger-400',
  },
  critical: {
    label: 'Critical',
    className: 'bg-danger-500 text-white ring-danger-500/40',
    dot: 'bg-white',
  },
}

export function RiskBadge({ level = 'low', label, className }) {
  const style = RISK_STYLES[level] ?? RISK_STYLES.low

  return (
    <span className={cn(BADGE_BASE, style.className, className)}>
      <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden="true" />
      {label ?? style.label}
    </span>
  )
}
