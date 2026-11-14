"use client";

import { AlertTriangle, Info, Link2, ShieldCheck } from 'lucide-react'
import { BaseCard, GlassCard, RiskBadge } from '../ui/index.js'
import { ScoreRing } from './ScoreRing.jsx'

const INDICATORS = [
  'Urgent account-blocking language',
  'KYC pressure and a deadline',
  'External link in an unsolicited message',
]

export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[2rem] bg-brand-500/5 blur-2xl"
      />

      <div className="relative">
        <BaseCard padding="none" className="overflow-hidden shadow-lift">
          <div className="flex items-center justify-between gap-3 border-b border-white/8 bg-navy-900/60 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">Message analysis</p>
                <p className="type-caption">Illustrative preview</p>
              </div>
            </div>
            <RiskBadge level="high" />
          </div>

          <div className="space-y-5 p-5">
            <div className="rounded-xl border border-white/8 bg-navy-950/60 p-4">
              <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                <span>Unknown sender</span>
                <span>SMS</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                &ldquo;Your UPI account will be blocked today. Complete KYC
                immediately using this link to avoid suspension.&rdquo;
              </p>
            </div>

            <div className="flex items-center gap-5">
              <ScoreRing value={86} tone="high" />
              <div className="min-w-0">
                <p className="type-label">Risk score</p>
                <p className="mt-1 text-lg font-semibold text-danger-400">
                  High risk
                </p>
                <p className="type-caption mt-1">3 warning indicators</p>
              </div>
            </div>

            <ul className="space-y-2">
              {INDICATORS.map((indicator) => (
                <li
                  key={indicator}
                  className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-slate-300"
                >
                  <AlertTriangle
                    className="size-3.5 shrink-0 text-warning-400"
                    aria-hidden="true"
                  />
                  {indicator}
                </li>
              ))}
            </ul>

            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Static sample for illustration only — not a live scan.
            </p>
          </div>
        </BaseCard>

        <GlassCard
          padding="sm"
          className="absolute -right-3 top-20 hidden w-44 sm:block"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-warning-500/10 text-warning-400 ring-1 ring-warning-500/20">
              <Link2 className="size-3.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-ink">Suspicious link</p>
              <p className="text-[10px] text-slate-500">External destination</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          padding="sm"
          className="absolute -left-4 bottom-16 hidden w-48 sm:block"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-ink">Risk explained</p>
              <p className="text-[10px] text-slate-500">Readable reasons</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
