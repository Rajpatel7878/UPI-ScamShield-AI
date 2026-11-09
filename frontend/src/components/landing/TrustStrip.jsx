import { ClipboardCheck, Globe, MessageSquareText, Sparkles } from 'lucide-react'
import { Container } from '../common/Container.jsx'

const CAPABILITIES = [
  {
    icon: Sparkles,
    title: 'AI-assisted message analysis',
    description: 'Contextual review of suspicious wording and payment requests.',
  },
  {
    icon: ClipboardCheck,
    title: 'Rule-based risk indicators',
    description: 'Known scam patterns surfaced as readable warnings.',
  },
  {
    icon: Globe,
    title: 'Suspicious URL checks',
    description: 'Link patterns examined without opening the destination.',
  },
  {
    icon: MessageSquareText,
    title: 'Clear risk explanations',
    description: 'Scores paired with plain-language reasons and next steps.',
  },
]

export function TrustStrip() {
  return (
    <section
      aria-label="Platform capabilities"
      className="border-y border-white/5 bg-navy-900/40"
    >
      <Container size="xl" className="py-10 sm:py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="type-caption mt-1">{description}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="type-caption mt-8 text-center text-slate-500">
          Product capabilities, not usage statistics. The analysis workspace is
          planned for a later phase.
        </p>
      </Container>
    </section>
  )
}
