import { ArrowRight, History as HistoryIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BaseCard, Button, EmptyState, StatusBadge } from '../components/ui/index.js'

function History() {
  return (
    <BaseCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="type-label">Scan records</p>
          <h2 className="type-h2 mt-1">No submission history</h2>
          <p className="type-body mt-2 max-w-xl text-muted">
            Detection history will become available after the analysis engine
            and storage layer are implemented.
          </p>
        </div>
        <StatusBadge status="neutral">Not connected</StatusBadge>
      </div>

      <div className="mt-6">
        <EmptyState
          icon={HistoryIcon}
          title="No scans yet"
          description="Results from previous analyses will appear here. Nothing is stored in this build."
          action={
            <Button
              as={Link}
              to="/detect"
              size="sm"
              rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
            >
              Open detection workspace
            </Button>
          }
        />
      </div>
    </BaseCard>
  )
}

export default History
