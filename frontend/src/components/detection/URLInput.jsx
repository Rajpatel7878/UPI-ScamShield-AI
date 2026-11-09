import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { useState } from 'react'

/** Basic URL pattern check. */
function isValidURL(text) {
  try {
    new URL(text)
    return true
  } catch {
    return false
  }
}

export function URLInput({
  value,
  onChange,
  onClear,
  onValidate,
  disabled = false,
}) {
  const [showCounter, setShowCounter] = useState(true)
  const [urlValid, setUrlValid] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const handleClear = () => {
    onClear()
    setShowCounter(false)
    setTimeout(() => setShowCounter(true), 150)
    setUrlValid(false)
  }

  const handleInputChange = (e) => {
    const text = e.target.value
    onChange(text)
    setUrlValid(isValidURL(text))
  }

  return (
    <div className="space-y-3">
      <label className="type-field-label">Enter suspicious URL</label>

      <textarea
        rows={3}
        cols={40}
        className={cn(
          'w-full rounded-lg border border-navy-700 bg-navy-950/50 px-4 py-3 text-base font-medium text-ink outline-none transition-colors focus:border-brand-500 focus:bg-navy-900/80 disabled:bg-navy-950/50 disabled:text-slate-500',
          disabled && 'cursor-not-allowed',
        )}
        value={value}
        onChange={handleInputChange}
        placeholder="https://example.com/verify-account"
        aria-label="Enter suspicious URL"
        disabled={disabled}
      ></textarea>

      {value.length > 0 && (
        <div className="flex items-baseline justify-between text-xs text-slate-500">
          {urlValid && (
            <span className="text-success-400">Valid URL format</span>
          )}
          {!urlValid && value.trim().length > 0 && (
            <span className="text-danger-400">Please enter a valid URL (http:// or https://)</span>
          )}
        </div>
      )}

      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/5 transition-colors duration-200"
          aria-label="Clear URL"
        >
          <Loader2 className="size-3.5 animate-spin hidden" aria-hidden="true" />
          <span className="hidden sm:inline">Clear</span>
          <span className="sm:hidden">✕</span>
        </button>
      )}

      {/* Warning about not submitting credentials */}
      {value.trim().length > 0 && (
        <p className="mt-3 text-xs type-caption text-warning-400">
          <strong>Warning:</strong> Never submit UPI PIN, OTP, or banking passwords.
          Verify requests through your bank's official app or website only.
        </p>
      )}
    </div>
  )
}