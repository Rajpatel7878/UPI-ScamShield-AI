import { ArrowRight, TriangleAlert } from 'lucide-react'
import { BaseCard } from '../ui/index.js'
import { getScamIcon } from './scamIcons.js'

/** Compact library card. Clicking it opens the full educational guide. */
export function ScamCard({ scam, onOpen }) {
  const Icon = getScamIcon(scam.icon)

  return (
    <BaseCard
      as="button"
      type="button"
      interactive
      padding="md"
      onClick={() => onOpen?.(scam.id)}
      className="flex h-full flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
      aria-label={`Open guide: ${scam.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-muted">
          {scam.category}
        </span>
      </div>

      <h3 className="type-h3 mt-4">{scam.name}</h3>
      <p className="type-body-sm mt-2 flex-1 text-slate-400">{scam.description}</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-warning-400">
          <TriangleAlert className="size-3.5" aria-hidden="true" />
          {scam.warningSigns.length} warning signs
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-300">
          Open guide
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </BaseCard>
  )
}
