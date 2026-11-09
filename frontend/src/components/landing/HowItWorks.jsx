import { Lightbulb, ScanLine, Send } from 'lucide-react'
import { Container } from '../common/Container.jsx'
import { SectionHeader } from '../common/SectionHeader.jsx'

const STEPS = [
  {
    icon: Send,
    title: 'Submit',
    description:
      'Paste a suspicious SMS, WhatsApp message, payment request, or URL.',
  },
  {
    icon: ScanLine,
    title: 'Analyze',
    description:
      'The system checks suspicious patterns and uses AI-assisted contextual analysis.',
  },
  {
    icon: Lightbulb,
    title: 'Understand',
    description:
      'Review the risk assessment, warning indicators, and recommended next steps.',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="scroll-mt-24 border-y border-white/5 bg-navy-900/30 py-16 sm:py-20 lg:py-24"
    >
      <Container size="xl">
        <SectionHeader
          id="how-it-works-title"
          eyebrow="How it works"
          title="Three Simple Steps. Smarter Decisions."
          description="From paste to explanation — no technical knowledge required."
          align="center"
        />

        <ol className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-8">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="relative">
              <div className="flex items-start gap-4 lg:block">
                <span className="relative z-10 inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-500/30 bg-navy-900 font-mono text-sm font-semibold text-brand-300 shadow-[0_0_24px_-8px_rgba(20,184,166,0.6)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 lg:mt-5">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-brand-300" aria-hidden="true" />
                    <h3 className="type-h3">{title}</h3>
                  </div>
                  <p className="type-body mt-2 max-w-sm text-muted">
                    {description}
                  </p>
                </div>
              </div>

              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-6 top-14 -bottom-6 w-px bg-linear-to-b from-brand-500/30 to-white/5 lg:hidden"
                />
              )}
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-14 top-6 hidden h-px w-[calc(100%-1rem)] bg-linear-to-r from-brand-500/40 via-brand-500/20 to-white/5 lg:block"
                />
              )}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
