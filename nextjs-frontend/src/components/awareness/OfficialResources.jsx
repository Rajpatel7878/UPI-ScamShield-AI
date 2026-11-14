"use client";

import { ExternalLink, Globe, Info, PhoneCall } from 'lucide-react'

import { OFFICIAL_RESOURCES } from '../../data/awareness/emergency.js'

/** Verified official reporting channels, visually separated from app content. */
export function OfficialResources() {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {OFFICIAL_RESOURCES.map((resource) => {
          const isPhone = resource.type === 'phone'
          const Icon = isPhone ? PhoneCall : Globe
          return (
            <a
              key={resource.id}
              href={resource.href}
              {...(isPhone
                ? {}
                : { target: '_blank', rel: 'noopener noreferrer' })}
              className="group flex h-full flex-col rounded-card border border-white/10 bg-navy-800 p-5 transition-colors hover:border-brand-500/40 hover:bg-navy-700/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/5 text-brand-300 ring-1 ring-white/10">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="rounded-full border border-success-500/30 bg-success-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success-400">
                  Official
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink">{resource.name}</h3>
              <p className="type-body-sm mt-1.5 flex-1 text-slate-400">
                {resource.description}
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-brand-300">
                {resource.value}
                {!isPhone && (
                  <ExternalLink
                    className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                )}
              </p>
            </a>
          )
        })}
      </div>

      <p className="type-body-sm mt-4 flex items-start gap-2 text-slate-500">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        These links point to external official websites and open in a new tab. The
        educational content on this page is created by UPI ScamShield AI and is not
        an official government publication. Always confirm reporting details on the
        official websites above.
      </p>
    </div>
  )
}
