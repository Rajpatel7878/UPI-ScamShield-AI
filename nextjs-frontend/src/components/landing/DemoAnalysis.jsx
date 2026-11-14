"use client";

import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Container } from '../common/Container.jsx';
import { SectionHeader } from '../common/SectionHeader.jsx';
import { GlassCard } from '../ui/index.js';

const INDICATORS = [
  'Urgent account-blocking language',
  'KYC pressure with a deadline',
  'Suspicious external link in an unsolicited message',
];

const RECOMMENDATION =
  'Do not open the link or share your OTP, UPI PIN, or banking credentials. Verify through your bank&rsquo;s official app or website.';

export function DemoAnalysis() {
  return (
    <section
      id="intelligent-detection"
      aria-labelledby="intelligent-detection-title"
      className="scroll-mt-24 py-16 sm:py-20 lg:py-28 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f1631235-0a76-464d-8f1d-2c4b48a997d5.jpg')] bg-cover bg-center opacity-[0.04]"
      />
      <Container size="xl">
        <SectionHeader
          id="intelligent-detection-title"
          eyebrow="Intelligent detection"
          title="See What the Risk Analysis Looks Like"
          description="A fixed illustrative preview of the results view. Nothing on this page is analyzed, scored, or submitted."
          align="center"
        />

        <div className="mt-12 flex flex-col lg:flex-row gap-8">
          <div className="flex-1 animate-fade-up entrance-1">
            <GlassCard padding="xl" className="neon-border-red">
              <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-5 mb-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-red-300" aria-hidden="true" />
                  <span className="type-label text-red-300">Illustrative result</span>
                </div>
                <span className="type-caption text-slate-500">Sample content — not live</span>
              </div>

              <div className="rounded-xl border border-white/8 bg-navy-950/60 p-5 mb-6">
                <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                  <span>Unknown sender</span>
                  <span>SMS</span>
                </div>
                <p className="mt-3 type-body text-slate-200 leading-relaxed">
                  &ldquo;Your UPI account will be blocked today. Complete KYC
                  immediately using this link to avoid suspension.&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg
                    className="risk-circle"
                    width="110"
                    height="110"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      className="risk-circle-bg"
                      cx="60"
                      cy="60"
                      r="50"
                    />
                    <circle
                      className="risk-circle-progress text-red-400"
                      cx="60"
                      cy="60"
                      r="50"
                      strokeDasharray="314"
                      strokeDashoffset="47"
                    />
                  </svg>
                  <div className="risk-circle-content">
                    <span className="text-xs font-mono text-slate-500">86</span>
                    <span className="text-[10px] font-medium text-slate-400">/ 100</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="type-label">Risk score</p>
                  <p className="mt-1 text-lg font-semibold text-red-400">
                    High risk
                  </p>
                  <p className="type-caption mt-1">3 warning indicators</p>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {INDICATORS.map((indicator) => (
                  <li
                    key={indicator}
                    className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3"
                  >
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-warning-500"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-300">{indicator}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-lg border border-danger-500/25 bg-danger-500/5 p-4">
                <div className="flex items-center gap-2 text-danger-400 mb-2">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  <p className="text-sm font-medium">Recommended next step</p>
                </div>
                <p className="type-body-sm text-slate-300">
                  {RECOMMENDATION}
                </p>
              </div>
            </GlassCard>
          </div>

          <div className="flex-1 animate-fade-up entrance-2">
            <GlassCard padding="xl">
              <div className="space-y-6">
                <div>
                  <p className="type-label">How the score is built</p>
                  <p className="type-body mt-2 text-slate-400 leading-relaxed">
                    The hybrid risk score combines <strong>60% rule-based
                    detection</strong> (known scam patterns, suspicious
                    keywords, URL risk signals) with <strong>40% AI-assisted
                    analysis</strong> (OpenRouter with Gemini fallback). The
                    result is a 0–100 score mapped to Low, Medium, High, or
                    Critical risk categories.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ['Rule-based', '60%', 'Matched patterns and indicators'],
                    ['AI analysis', '40%', 'OpenRouter / Gemini contextual review'],
                    ['URL scan', 'Passive', 'Links checked without being opened'],
                    ['Credential masking', 'Automatic', 'OTP, PIN, and card values redacted'],
                  ].map(([label, value, desc]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-white/8 bg-white/[0.02] p-4"
                    >
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-lg font-semibold text-ink">{value}</span>
                        <span className="text-sm text-slate-500">{label === 'URL scan' ? '' : 'weight'}</span>
                      </div>
                      <p className="type-caption">{desc}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <p className="type-label">Risk thresholds</p>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">0–29: Low</span>
                      <span className="text-success-500">Minimal concern</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">30–59: Medium</span>
                      <span className="text-warning-500">Exercise caution</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">60–79: High</span>
                      <span className="text-danger-500">High suspicion</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">80–100: Critical</span>
                      <span className="text-red-500">Immediate caution</span>
                    </div>
                  </div>
                  <p className="type-caption mt-3 text-slate-500">
                    Heuristic results are indicators, not verified proof of fraud.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </Container>
    </section>
  );
}
