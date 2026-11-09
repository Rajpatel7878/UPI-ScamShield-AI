import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { useState } from 'react'

export function AnalyzeButton({
  isDisabled = false,
  onClick,
  children = 'Analyze for Scams',
  showDemoNotice = true,
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async (e) => {
    if (isDisabled) return

    setIsLoading(true)
    try {
      // Simulate a brief local interaction only — no API call
      await new Promise((resolve) => setTimeout(resolve, 800))
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false)
    }
    onClick?.(e)
  }

  // Accessible label
  const ariaLabel = 'Analyze for scams'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      className="w-full rounded-lg border border-brand-500 bg-brand-500 text-navy-950 px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-brand-400 active:bg-brand-600" aria-label={ariaLabel}
    >
      {isLoading ? (
        <>
          <Loader2 />
          Processing
        </>
      ) : (
        children
      )}
      {showDemoNotice && !isLoading && (
        <p className="mt-1 text-xs text-slate-500">
          Demo mode: The detection engine will be connected in a later
          development phase.
        </p>
      )}
    </button>
  )
}