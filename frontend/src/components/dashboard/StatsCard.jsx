import { cn } from '../../utils/cn.js'
import { StatCard } from '../../components/ui/Card.jsx'

/** A stat card for the dashboard. Reuses the existing StatCard from Card.jsx
 * but can be customized with dashboard-specific props. */
export function DashboardStatsCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'brand',
  className,
}) {
  return (
    <StatCard
      label={label}
      value={value}
      hint={description}
      icon={Icon}
      tone={tone}
      className={cn('flex-1 sm:w-64', className)}
    />
  )
}