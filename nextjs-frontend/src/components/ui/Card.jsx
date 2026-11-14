"use client";

import { cn } from '../../utils/cn.js'

const CARD_BASE = 'rounded-2xl border border-white/8 bg-white/[0.02] shadow-card'
const CARD_PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
  xl: 'p-8 sm:p-10',
}
const INTERACTIVE =
  'transition-all duration-300 ease-[var(--ease-soft)] hover:-translate-y-1 hover:border-white/20 hover:shadow-glow-red'

const TONES = {
  brand: 'bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20',
  success: 'bg-success-500/10 text-success-400 ring-1 ring-success-500/20',
  warning: 'bg-warning-500/10 text-warning-400 ring-1 ring-warning-500/20',
  danger: 'bg-danger-500/10 text-danger-400 ring-1 ring-danger-500/20',
}

export function BaseCard({
  as: Tag = 'div',
  interactive = false,
  padding = 'md',
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        CARD_BASE,
        'shadow-card',
        CARD_PADDING[padding],
        interactive && INTERACTIVE,
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function GlassCard({ className, padding = 'md', children, ...props }) {
  return (
    <BaseCard
      padding={padding}
      className={cn(
        'border-white/10 bg-white/[0.03] shadow-card backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      {children}
    </BaseCard>
  )
}

export function GlassCardStrong({ className, padding = 'md', children, ...props }) {
  return (
    <BaseCard
      padding={padding}
      className={cn(
        'border-white/12 bg-white/[0.05] shadow-card backdrop-blur-2xl',
        className,
      )}
      {...props}
    >
      {children}
    </BaseCard>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
  className,
}) {
  return (
    <BaseCard className={cn('flex flex-col', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="type-label">{label}</p>
        {Icon && (
          <span
            className={cn(
              'inline-flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1',
              TONES[tone],
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="type-stat mt-3">{value}</p>
      {hint && <p className="type-caption mt-1">{hint}</p>}
    </BaseCard>
  )
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  children,
  interactive = true,
  className,
}) {
  return (
    <BaseCard
      interactive={interactive}
      className={cn('flex h-full flex-col gap-4', className)}
    >
      {Icon && (
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <h3 className="type-h3">{title}</h3>
      {description && <p className="type-body text-muted">{description}</p>}
      {children && <div className="mt-auto pt-2">{children}</div>}
    </BaseCard>
  )
}

const INFO_TONES = {
  brand: 'border-brand-500/30 bg-brand-500/5 text-brand-300',
  success: 'border-success-500/30 bg-success-500/5 text-success-400',
  warning: 'border-warning-500/30 bg-warning-500/5 text-warning-400',
  danger: 'border-danger-500/30 bg-danger-500/5 text-danger-400',
}

export function InfoCard({ title, icon: Icon, tone = 'brand', className, children }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-l-2 p-6',
        INFO_TONES[tone],
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />}
        <h3 className="type-h3">{title}</h3>
      </div>
      <div className="type-body mt-3 text-slate-300 leading-relaxed">{children}</div>
    </div>
  )
}
