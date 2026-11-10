import { Eye } from 'lucide-react'

import { SUSPICIOUS_MESSAGE_FLAGS } from '../../data/awareness/suspiciousMessageFlags.js'

/** Red-flag grid: how to identify a suspicious UPI message. */
export function SuspiciousMessages() {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SUSPICIOUS_MESSAGE_FLAGS.map((flag) => {
          const Icon = flag.icon
          return (
            <div
              key={flag.id}
              className="rounded-xl border border-white/8 bg-navy-800 p-4 transition-colors hover:border-warning-500/30"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-warning-500/10 text-warning-400 ring-1 ring-warning-500/20">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-sm font-medium text-ink">{flag.title}</h3>
              <p className="type-body-sm mt-1.5 text-slate-400">{flag.description}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-brand-500/25 bg-brand-500/[0.07] p-4">
        <Eye className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden="true" />
        <p className="type-body-sm text-slate-300">
          <span className="font-medium text-brand-200">A useful pause:</span> if a
          message asks you to do something unusual with money or credentials, stop and
          verify it through the official app or a number you found independently.
          Urgency is a reason to slow down, not a reason to act.
        </p>
      </div>
    </div>
  )
}
