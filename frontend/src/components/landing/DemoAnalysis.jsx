import { AlertTriangle, ArrowRight, Info, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '../common/Container.jsx'
import { SectionHeader } from '../common/SectionHeader.jsx'
import { BaseCard, Button, RiskBadge, StatusBadge } from '../ui/index.js'
import { ScoreRing } from './ScoreRing.jsx'

const INDICATORS = [
  'Urgent account-blocking language.',
  'KYC-related pressure.',
  'Suspicious external link.',
]

const RECOMMENDATION =
  "Do not open the link or share your OTP, UPI PIN, or banking credentials. Verify through your bank's official app or website."

export function DemoAnalysis() {
  return (
    <section
      id="demo"
      aria-labelledby="demo-title"
      className="scroll-mt-24 py-16 sm:py-20 lg:py-24"
    >
      <Container size="lg">
        <SectionHeader
          id="demo-title"
          eyebrow="Illustrative demo"
          title="See What a Risk Explanation Could Look Like"
          description="A fixed sample of the planned results view. Nothing on this page is analysed, scored, or submitted."
          align="center"
        />

        <BaseCard
          padding="lg"
          className="mt-10 bg-linear-to-br from-navy-900 via-navy-800 to-navy-900 sm:mt-12"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-5">
            <div className="flex items-center gap-2">
              <StatusBadge status="neutral">Static demo</StatusBadge>
              <span className="type-caption">Example content — not live analysis</span>
            </div>
            <RiskBadge level="high" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            <div>
              <p className="type-label">Sample message</p>
              <div className="mt-3 rounded-xl border border-white/8 bg-navy-950/60 p-4">
                <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                  <span>Unknown sender</span>
                  <span>SMS</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">
                  &ldquo;Your UPI account will be blocked today. Complete KYC
                  immediately using this link to avoid suspension.&rdquo;
                </p>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-slate-400">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p className="type-caption">
                  This example is labelled for demonstration. It does not come
                  from a real message, and no assessment is generated here.
                </p>
              </div>
            </div>

            <div>
              <p className="type-label">Sample result</p>
              <div className="mt-3 flex items-center gap-5">
                <ScoreRing value={86} tone="high" label="Example risk score" />
                <div>
                  <RiskBadge level="high" />
                  <p className="mt-2 text-sm font-medium text-ink">High risk</p>
                  <p className="type-caption mt-1">Based on 3 example indicators</p>
                </div>
              </div>

              <ul className="mt-5 space-y-2">
                {INDICATORS.map((indicator) => (
                  <li
                    key={indicator}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-warning-400"
                      aria-hidden="true"
                    />
                    {indicator}
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-xl border border-danger-500/25 bg-danger-500/5 p-4">
                <div className="flex items-center gap-2 text-danger-400">
                  <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
                  <p className="text-sm font-medium">Recommended next step</p>
                </div>
                <p className="type-body mt-2 text-slate-300">{RECOMMENDATION}</p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="type-caption">
              Risk levels are visual examples. The scoring engine arrives in a
              later phase.
            </p>
            <Button
              as={Link}
              to="/detect"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
            >
              Open the detection route
            </Button>
          </div>
        </BaseCard>
      </Container>
    </section>
  )
}
