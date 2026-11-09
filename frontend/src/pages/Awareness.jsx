import { GraduationCap, Link2, ShieldCheck } from 'lucide-react'
import {
  BaseCard,
  EmptyState,
  InfoCard,
  StatusBadge,
} from '../components/ui/index.js'

function Awareness() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <BaseCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="type-label">Learning library</p>
            <h2 className="type-h2 mt-1">Awareness guides</h2>
            <p className="type-body mt-2 max-w-xl text-muted">
              Plain-language guides on phishing, fake payment requests, and
              common UPI fraud techniques will live here.
            </p>
          </div>
          <StatusBadge status="neutral">Planned</StatusBadge>
        </div>

        <div className="mt-6">
          <EmptyState
            icon={GraduationCap}
            title="Guides are being prepared"
            description="The awareness library is not published yet. In the meantime, the reminders alongside cover the essentials."
          />
        </div>
      </BaseCard>

      <div className="space-y-4">
        <InfoCard title="Never share your OTP or UPI PIN" icon={ShieldCheck}>
          No genuine bank, payment app, or support agent needs these to keep
          your account safe.
        </InfoCard>
        <InfoCard title="Check before you tap" icon={Link2} tone="warning">
          Avoid opening unexpected links. Navigate to your bank&rsquo;s
          official app or website directly instead.
        </InfoCard>
      </div>
    </div>
  )
}

export default Awareness
