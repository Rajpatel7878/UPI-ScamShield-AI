"use client";

import {
  AlertTriangle,
  Gauge,
  Globe,
  GraduationCap,
  Link2,
  ShieldCheck,
} from 'lucide-react';
import { Container } from '../common/Container.jsx';
import { SectionHeader } from '../common/SectionHeader.jsx';
import { ResponsiveGrid } from '../common/ResponsiveGrid.jsx';
import { GlassCard } from '../ui/index.js';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'AI Scam Detection',
    description:
      'Analyze suspicious messages using AI-assisted contextual analysis with OpenRouter and Gemini fallback.',
  },
  {
    icon: Link2,
    title: 'Phishing Message Detection',
    description:
      'Identify suspicious links, urgent language, impersonation, and common phishing patterns in UPI communications.',
  },
  {
    icon: AlertTriangle,
    title: 'UPI Fraud Indicators',
    description:
      'Highlight suspicious payment requests and potentially deceptive payment instructions before you act.',
  },
  {
    icon: Globe,
    title: 'URL Risk Analysis',
    description:
      'Examine URL patterns and highlight potentially dangerous indicators without automatically opening suspicious links.',
  },
  {
    icon: Gauge,
    title: 'Risk Score & Explanation',
    description:
      'A 0–100 risk score with severity classification, detection reasons, and recommended safety actions.',
  },
  {
    icon: GraduationCap,
    title: 'Security Awareness',
    description:
      'Learn to recognize common UPI scams — KYC fraud, OTP theft, cashback lures, QR scams, and more.',
  },
];

export function FeatureSection() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="scroll-mt-24 py-16 sm:py-20 lg:py-28 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f1631235-0a76-464d-8f1d-2c4b48a997d5.jpg')] bg-cover bg-center opacity-[0.06] blur-[20px]"
      />
      <Container size="xl">
        <SectionHeader
          id="features-title"
          eyebrow="Capabilities"
          title="Smart Protection Against Digital Payment Scams"
          description="Six layers of awareness designed to help you pause, check, and decide before acting on an unexpected request."
          align="center"
        />

        <div className="mt-12 sm:mt-16">
          <ResponsiveGrid columns={3} gap="xl">
            {FEATURES.map((feature, idx) => (
              <GlassCard
                key={feature.title}
                className={`group hover:shadow-glow-red transition-all duration-500 animate-fade-up entrance-${Math.min(idx + 2, 5)}`}
                padding="lg"
              >
                <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-300 ring-1 ring-red-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="type-h3 mb-2">{feature.title}</h3>
                <p className="type-body text-slate-400">{feature.description}</p>
              </GlassCard>
            ))}
          </ResponsiveGrid>
        </div>
      </Container>
    </section>
  );
}
