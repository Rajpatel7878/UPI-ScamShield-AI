import { Clock, X } from 'lucide-react'
import { BaseCard, Button, EmptyState } from '../../components/ui/index.js'
import { Link, useNavigate } from 'react-router-dom'
import { RECENT_SCANS } from '../../mock-data/dashboard.js'

/** Render a risk-level badge. */
function RiskBadge({ level }) {
  const _tones = {
    critical: 'danger',
    high: 'warning',
    medium: 'success',
    low: 'brand',
  }
  const _colors = {
    critical: 'bg-danger-500/20 text-danger-400',
    high: 'bg-warning-500/20 text-warning-400',
    medium: 'bg-success-500/20 text-success-400',
    low: 'bg-brand-500/20 text-brand-300',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        colors[level] ?? 'bg-slate-500/20 text-slate-400',
      )}
    >
      {level}
    </span>
  )
}

/** Format date string to a readable format. */
function formatDate(isoDate) {
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/** Render a single recent scan row. */
function RecentScanRow({ record }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="type-caption truncate text-slate-400">
          {record.content}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="type-caption text-slate-400">{record.type}</span>
        <RiskBadge level={record.riskLevel} />
      </div>
      <RiskBadge level={record.riskLevel} />
      <span className="type-caption text-slate-400 ml-2">{record.riskScore}</span>
      <span className="type-caption text-slate-400 ml-2">
        {formatDate(record.date)}
      </span>
      <div className="ml-4">
        <Button
          size="icon"
          variant="ghost"
          aria-label="View details"
          onClick={() => navigate('/detect')}
          title="View details"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

export function RecentScans() {
  return (
    <BaseCard className="pt-4">
      {RECENT_SCANS.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No scan records yet"
          description="Analyze messages to populate your detection history."
          action={
            <Button as={Link} to="/detect" size="sm" rightIcon={<X className="size-4" aria-hidden="true" />}>
              Open detection workspace
            </Button>
          }
        />
      ) : (
        <div className="space-y-1">
          {RECENT_SCANS.map((record) => (
            <RecentScanRow key={record.id} record={record} />
          ))}
        </div>
      )}
    </BaseCard>
  )
}