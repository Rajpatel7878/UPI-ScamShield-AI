"use client";

import { Lightbulb, ScanLine, Send } from 'lucide-react';
import { Container } from '../common/Container.jsx';
import { SectionHeader } from '../common/SectionHeader.jsx';

const STEPS = [
  {
    icon: Send,
    title: 'Submit',
    description:
      'Paste a suspicious SMS, WhatsApp message, payment request, or URL into the scanner.',
  },
  {
    icon: ScanLine,
    title: 'Analyze',
    description:
      'Rule-based detection (60%) combines with AI analysis (40%) via OpenRouter or Gemini for a hybrid risk score.',
  },
  {
    icon: Lightbulb,
    title: 'Understand',
    description:
      'Review the risk category, detection indicators, and recommended safety actions before you respond.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="scroll-mt-24 border-y border-white/5 bg-navy-900/20 py-16 sm:py-20 lg:py-28 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-red-500/5 via-blue-500/5 to-magenta-500/5"
      />
      <Container size="xl">
        <SectionHeader
          id="how-it-works-title"
          eyebrow="How it works"
          title="Three Simple Steps. Smarter Decisions."
          description="From paste to explanation — no technical knowledge required."
          align="center"
        />

        <ol className="mt-16 relative grid gap-12 lg:grid-cols-3 lg:gap-12">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="relative group">
              <div className="flex flex-col lg:flex-row items-start gap-4 lg:items-center">
                <div className="relative z-10 inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-navy-800 font-mono text-sm font-semibold text-ink shadow-glow-red group-hover:ring-2 group-hover:ring-red-500/30 transition-all duration-300">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="min-w-0 lg:mt-4 lg:text-left">
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4 text-red-300 group-hover:text-red-400 transition-colors" aria-hidden="true" />
                    <h3 className="type-h3">{title}</h3>
                  </div>
                  <p className="type-body mt-2 max-w-sm text-slate-400">
                    {description}
                  </p>
                </div>
              </div>

              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden lg:block absolute -top-3 left-1/2 -translate-x-1/2 h-[calc(100%+6px)] w-px bg-gradient-to-b from-red-500/20 to-transparent"
                />
              )}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
