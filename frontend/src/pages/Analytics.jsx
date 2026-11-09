import { ChartNoAxesColumn } from 'lucide-react'
import { BaseCard, EmptyState, StatusBadge } from '../components/ui/index.js'

function Analytics() {
  return (
    <BaseCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="type-label">Risk trends</p>
          <h2 className="type-h2 mt-1">No analytics data</h2>
          <p className="type-body mt-2 max-w-xl text-muted">
            Charts and trend summaries will be built once detection results and
            history data exist.
          </p>
        </div>
        <StatusBadge status="neutral">Not connected</StatusBadge>
      </div>

      <div className="mt-6">
        <EmptyState
          icon={ChartNoAxesColumn}
          title="Analytics will appear after detection"
          description="Activity summaries and risk trends require stored analysis results, which are planned for a later phase."
        />
      </div>
    </BaseCard>
  )
}

export default Analytics
