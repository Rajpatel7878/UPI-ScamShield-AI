import { Lock, ScanLine, ShieldCheck } from 'lucide-react'
import {
  BaseCard,
  Button,
  InfoCard,
  StatusBadge,
} from '../components/ui/index.js'

function Detection() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
      <BaseCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
              <ScanLine className="size-4" aria-hidden="true" />
            </span>
            <h2 className="type-h2">Analysis workspace</h2>
          </div>
          <StatusBadge status="neutral">Not connected</StatusBadge>
        </div>

        <p className="type-body mt-3 max-w-xl text-muted">
          Paste a suspicious SMS, WhatsApp message, payment request, or URL.
          The analysis flow will be implemented in a later phase.
        </p>

        <div className="mt-6 rounded-xl border border-dashed border-navy-700 bg-navy-950/40 p-6 text-center">
          <p className="type-label">Message input</p>
          <p className="type-caption mx-auto mt-2 max-w-sm">
            The input, URL checks, and AI-assisted assessment are not available
            yet. Nothing is submitted or stored on this page.
          </p>
          <Button className="mt-5" disabled leftIcon={<ScanLine className="size-4" aria-hidden="true" />}>
            Analyze message
          </Button>
        </div>
      </BaseCard>

      <div className="space-y-4">
        <InfoCard title="What will be checked" icon={ShieldCheck}>
          Links, urgent language, impersonation patterns, and payment
          instructions will be reviewed and explained in plain language.
        </InfoCard>
        <InfoCard
          title="Your credentials stay private"
          icon={Lock}
          tone="warning"
        >
          ScamShield AI will never ask for your OTP, UPI PIN, or banking
          password. Verify unexpected requests through your bank&rsquo;s
          official app or website.
        </InfoCard>
      </div>
    </div>
  )
}

export default Detection
