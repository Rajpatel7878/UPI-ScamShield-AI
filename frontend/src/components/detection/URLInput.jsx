import { cn } from '../../utils/cn.js'

/** Requires an explicit http(s) scheme, matching backend URL extraction. */
function isValidURL(text) {
  try {
    const parsed = new URL(text)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function URLInput({
  value,
  onChange,
  onClear,
  disabled = false,
}) {
  const urlValid = isValidURL(value.trim())

  return (
    <div className="space-y-3">
      <label className="type-field-label" htmlFor="detection-url">
        Enter suspicious URL
      </label>

      <textarea
        id="detection-url"
        rows={3}
        cols={40}
        className={cn(
          'w-full rounded-lg border border-navy-700 bg-navy-950/50 px-4 py-3 text-base font-medium text-ink outline-none transition-colors focus:border-brand-500 focus:bg-navy-900/80 disabled:bg-navy-950/50 disabled:text-slate-500',
          disabled && 'cursor-not-allowed',
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://example.com/verify-account"
        aria-label="Enter suspicious URL"
        aria-describedby="detection-url-status"
        maxLength={2000}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
      ></textarea>

      <div id="detection-url-status" aria-live="polite" className="min-h-4 text-xs">
        {value.trim().length > 0 && urlValid && (
          <span className="text-success-400">Valid URL format</span>
        )}
        {value.trim().length > 0 && !urlValid && (
          <span className="text-danger-400">
            Enter a full URL starting with http:// or https://
          </span>
        )}
      </div>

      {value.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5"
          aria-label="Clear URL"
        >
          Clear
        </button>
      )}

      {value.trim().length > 0 && (
        <p className="type-caption text-warning-400">
          <strong>Warning:</strong> Never submit a UPI PIN, OTP, or banking
          password. The URL is analyzed passively and is never opened.
        </p>
      )}
    </div>
  )
}
