import { ArrowRight, History, ScanLine, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  BaseCard,
  Button,
  EmptyState,
  StatCard,
  StatusBadge,
} from '../components/ui/index.js'

function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Scans this week"
          value="—"
          hint="Populates once detection is connected"
          icon={ScanLine}
        />
        <StatCard
          label="High-risk alerts"
          value="—"
          hint="No risk engine connected yet"
          icon={ShieldAlert}
          tone="warning"
        />
        <StatCard
          label="Saved results"
          value="—"
          hint="History storage arrives later"
          icon={History}
          tone="success"
        />
      </div>

      <BaseCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="type-label">Workspace status</p>
            <h2 className="type-h2 mt-1">Detection engine not connected</h2>
            <p className="type-body mt-2 max-w-xl text-muted">
              This overview is a layout preview. Metrics, alerts, and recent
              scans will populate after the detection and history phases.
            </p>
          </div>
          <StatusBadge status="neutral">Preview</StatusBadge>
        </div>

        <div className="mt-6">
          <EmptyState
            icon={ScanLine}
            title="No security activity yet"
            description="Once analysis is available, your recent scans and risk insights will appear here."
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
    </div>
  )
}

export default Dashboard
