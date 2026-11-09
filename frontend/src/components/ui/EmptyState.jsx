import { Inbox } from 'lucide-react'
import { cn } from '../../utils/cn.js'

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-card border border-dashed border-navy-700 bg-navy-900/40 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-white/5 text-slate-500 ring-1 ring-white/10">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      {description && <p className="type-body-sm mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
