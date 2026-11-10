import { Loader2, ScanLine } from 'lucide-react'

export function AnalyzeButton({
  isDisabled = false,
  isLoading = false,
  onClick,
  children = 'Analyze for Scams',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled || isLoading}
      aria-busy={isLoading || undefined}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-navy-950 transition-colors duration-200 hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:pointer-events-none disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Analyzing…
        </>
      ) : (
        <>
          <ScanLine className="size-4" aria-hidden="true" />
          {children}
        </>
      )}
    </button>
  )
}
