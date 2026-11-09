import { cn } from '../../utils/cn.js'

/**
 * Skeleton placeholder. Size it with utilities, e.g.
 * `<SkeletonLoader className="h-4 w-40" />`.
 */
export function SkeletonLoader({ className, rounded = 'md' }) {
  const radii = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer bg-linear-to-r from-white/5 via-white/10 to-white/5',
        radii[rounded] ?? radii.md,
        className,
      )}
    />
  )
}
