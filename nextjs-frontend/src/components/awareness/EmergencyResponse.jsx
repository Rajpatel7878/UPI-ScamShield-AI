"use client";

import { ExternalLink, PhoneCall, ShieldAlert, Siren } from 'lucide-react'

import { EMERGENCY_STEPS } from '../../data/awareness/emergency.js'
import { BaseCard } from '../ui/index.js'

/** High-visibility emergency response guidance. */
export function EmergencyResponse() {
  return (
    <BaseCard
      padding="lg"
      className="border-danger-500/30 bg-danger-500/[0.04] shadow-[0_0_0_1px_rgba(239,68,68,0.08),0_24px_48px_-24px_rgba(239,68,68,0.35)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-danger-500/20 pb-5">
        <div className="flex gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-danger-500/15 text-danger-400 ring-1 ring-danger-500/30">
            <Siren className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="type-h2">What to do if you are scammed</h3>
            <p className="type-body mt-1 max-w-2xl text-slate-300">
              Act quickly, but do not send more money. Reporting does not guarantee a
              refund, and no one can promise that money will be recovered.
            </p>
          </div>
        </div>

        <a
          href="tel:1930"
          className="inline-flex items-center gap-3 rounded-xl border border-danger-500/40 bg-danger-500/10 px-4 py-3 transition-colors hover:border-danger-400 hover:bg-danger-500/15"
          aria-label="Call India's cybercrime financial fraud helpline 1930"
        >
          <PhoneCall className="size-5 text-danger-400" aria-hidden="true" />
          <span>
            <span className="block text-[11px] uppercase tracking-[0.14em] text-danger-300">
              India cybercrime helpline
            </span>
            <span className="block font-mono text-2xl font-semibold tracking-tight text-ink">
              1930
            </span>
          </span>
        </a>
      </div>

      <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EMERGENCY_STEPS.map((step, index) => (
          <li
            key={step.title}
            className="rounded-xl border border-white/8 bg-navy-800/80 p-4"
          >
            <p className="flex items-start gap-2.5 text-sm font-medium text-ink">
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-danger-500/15 font-mono text-[11px] text-danger-400">
                {index + 1}
              </span>
              {step.title}
            </p>
            <p className="type-body-sm mt-2 pl-8.5 text-slate-400">{step.detail}</p>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-warning-500/25 bg-warning-500/[0.07] p-4 sm:flex-row sm:items-start">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning-400" aria-hidden="true" />
        <div className="type-body-sm text-slate-300">
          <p className="font-medium text-warning-300">Beware of recovery scams</p>
          <p className="mt-1">
            Fraudsters often contact victims again, posing as recovery agents, police,
            or lawyers. They may ask for an advance fee or more OTPs and promise a
            guaranteed refund. Do not pay them or share credentials.
          </p>
          <a
            href="https://cybercrime.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 font-medium text-brand-300 underline underline-offset-4 hover:text-brand-200"
          >
            File a complaint on the official portal
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </BaseCard>
  )
}
