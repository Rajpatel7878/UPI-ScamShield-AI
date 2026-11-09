import { Check, KeyRound, Landmark, Link2, Lock, ShieldAlert, Trash2 } from 'lucide-react'
import { Container } from '../common/Container.jsx'
import { SectionHeader } from '../common/SectionHeader.jsx'
import { BaseCard, InfoCard } from '../ui/index.js'

const PRINCIPLES = [
  {
    icon: KeyRound,
    title: 'We never ask for your UPI PIN or OTP',
    description:
      'No screen in this product will request the credentials used to authorise a payment.',
  },
  {
    icon: Lock,
    title: 'We never ask for banking passwords',
    description:
      'Net banking passwords and card details are not part of the analysis flow.',
  },
  {
    icon: Trash2,
    title: 'No unnecessary storage of submitted content',
    description:
      'Content handling is designed around the minimum needed for an assessment.',
  },
  {
    icon: Link2,
    title: 'Suspicious links are not opened automatically',
    description:
      'Link patterns are examined without silently visiting the destination.',
  },
  {
    icon: Landmark,
    title: 'Verify important actions with your bank',
    description:
      'AI assessments can make mistakes and do not replace your bank\u2019s official app or website.',
  },
]

export function SecuritySection() {
  return (
    <section
      id="security"
      aria-labelledby="security-title"
      className="scroll-mt-24 border-y border-white/5 bg-navy-900/30 py-16 sm:py-20 lg:py-24"
    >
      <Container size="xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
          <div>
            <SectionHeader
              id="security-title"
              eyebrow="Security & privacy"
              title="Your Security Comes First"
              description="ScamShield AI is designed around restraint: collect less, explain more, and never push you toward a risky action."
            />
          </div>

          <BaseCard padding="lg">
            <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6">
              {PRINCIPLES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{title}</p>
                    <p className="type-caption mt-1">{description}</p>
                  </div>
                </li>
              ))}
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-success-500/10 text-success-400 ring-1 ring-success-500/20">
                  <Check className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    Clear, responsible language
                  </p>
                  <p className="type-caption mt-1">
                    Warnings describe what looks suspicious without claiming
                    certainty.
                  </p>
                </div>
              </li>
            </ul>
          </BaseCard>
        </div>

        <div className="mt-8">
          <InfoCard
            title="Assessments are guidance, not guarantees"
            icon={ShieldAlert}
            tone="warning"
          >
            AI-assisted assessments can be wrong or incomplete. Always confirm
            unexpected requests through your bank&rsquo;s official app or website
            before sharing information or approving a payment. This project does
            not claim any security certification or guaranteed fraud detection.
          </InfoCard>
        </div>
      </Container>
    </section>
  )
}
