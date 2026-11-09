import { cn } from '../../utils/cn.js'

export function SectionHeader({ id, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 id={id} className="type-h2 scroll-mt-24">
          {title}
        </h2>
        {description && (
          <p className="type-body-sm mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
