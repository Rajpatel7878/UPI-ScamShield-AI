import { Check, KeyRound, Landmark, Link2, Lock, ShieldAlert, Trash2 } from 'lucide-react';
import { Container } from '../common/Container.jsx';
import { SectionHeader } from '../common/SectionHeader.jsx';
import { GlassCard, InfoCard } from '../ui/index.js';

const PRINCIPLES = [
  {
    icon: KeyRound,
    title: 'We never ask for your UPI PIN or OTP',
    description:
      'No screen in this product will request the credentials used to authorize a payment.',
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
      'AI assessments can make mistakes and do not replace your bank&rsquo;s official app or website.',
  },
];

export function SecuritySection() {
  return (
    <section
      id="security"
      aria-labelledby="security-title"
      className="scroll-mt-24 border-y border-white/5 py-16 sm:py-20 lg:py-28 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-red-500/5"
      />
      <Container size="xl">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.2fr] lg:items-start lg:gap-16">
          <div className="animate-fade-up entrance-1">
            <SectionHeader
              id="security-title"
              eyebrow="Security & privacy"
              title="Your Security Comes First"
              description="ScamShield AI is designed around restraint: collect less, explain more, and never push you toward a risky action."
            />
          </div>

          <GlassCard padding="xl" className="animate-fade-up entrance-2 neon-border-red">
            <ul className="grid gap-6 sm:grid-cols-2 sm:gap-8">
              {PRINCIPLES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-300 ring-1 ring-red-500/20">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="type-h3 text-ink">{title}</p>
                    <p className="type-caption mt-1.5">{description}</p>
                  </div>
                </li>
              ))}
              <li className="flex items-start gap-4">
                <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-500/10 text-success-500 ring-1 ring-success-500/20">
                  <Check className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="type-h3 text-ink">Clear, responsible language</p>
                  <p className="type-caption mt-1.5">
                    Warnings describe what looks suspicious without claiming certainty.
                  </p>
                </div>
              </li>
            </ul>
          </GlassCard>
        </div>

        <div className="mt-12">
          <InfoCard
            title="Assessments are guidance, not guarantees"
            icon={ShieldAlert}
            tone="warning"
            className="animate-fade-up entrance-3"
          >
            AI-assisted assessments can be wrong or incomplete. Always confirm
            unexpected requests through your bank&rsquo;s official app or website
            before sharing information or approving a payment. This project does
            not claim any security certification or guaranteed fraud detection.
          </InfoCard>
        </div>
      </Container>
    </section>
  );
}
