import { ShieldAlert } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { SecondaryButton } from './Button.jsx'

export function ErrorState({
  icon: Icon = ShieldAlert,
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center rounded-2xl border border-danger-500/25 bg-danger-500/5 px-6 py-10 text-center',
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-danger-500/10 text-danger-400 ring-1 ring-danger-500/20">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="type-body-sm mt-1 max-w-sm text-slate-400">{description}</p>
      )}
      {onRetry && (
        <SecondaryButton className="mt-5" onClick={onRetry}>
          {retryLabel}
        </SecondaryButton>
      )}
    </div>
  )
}
