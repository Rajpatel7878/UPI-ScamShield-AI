import { ClipboardCheck, Globe, MessageSquareText, Sparkles } from 'lucide-react';
import { Container } from '../common/Container.jsx';

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
];

export function TrustStrip() {
  return (
    <section
      aria-label="Platform capabilities"
      className="border-y border-white/5 bg-navy-900/20 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_48%,rgb(255_255_255/0.01)_48%_rgb(255_255_255/0.01)_52%_transparent_52%)] bg-[40px_40px]"
      />
      <Container size="xl" className="py-12 sm:py-16 relative z-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-300 ring-1 ring-red-500/20">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="type-h3 text-ink">{title}</p>
                <p className="type-caption mt-1.5 text-slate-400">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
