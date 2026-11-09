import { ShieldAlert } from 'lucide-react'

export function DetectionEmptyState() {
  return (
    <div className="pt-24 text-center">
      <div className="inline-flex size-12 items-center justify-center rounded-xl bg-navy-900/50 text-slate-500 ring-1 ring-white/10">
        <ShieldAlert className="size-6" aria-hidden="true" />
      </div>

      <h3 className="mt-4 type-h3">Enter content to analyze</h3>
      <p className="type-body mt-2 text-slate-500">
        Paste a suspicious message, payment request, or URL to check for potential
        security risks. The analysis results will appear here.
      </p>

      <p className="mt-4 type-caption text-slate-500">
        <strong>Demo mode:</strong> The detection engine will be connected in a
        later development phase.
      </p>
    </div>
  )
}