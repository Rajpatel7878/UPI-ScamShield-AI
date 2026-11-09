import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { useState } from 'react'

/** Minimum and maximum character limits per content type. */
const LIMITS = {
  sms: { min: 1, max: 160 },
  whatsapp: { min: 1, max: 65000 },
  payment: { min: 1, max: 1000 },
  url: { min: 1, max: 500 },
}

/** Placeholder text per content type. */
const PLACEHOLDERS = {
  sms: 'Paste the suspicious message or SMS here...',
  whatsapp: 'Paste the suspicious WhatsApp message here...',
  payment: 'Paste the suspicious payment request here...',
  url: 'Enter a suspicious URL (https:// or http://)...',
}

/** Label text per content type. */
const LABELS = {
  sms: 'Paste suspicious content',
  whatsapp: 'Paste suspicious content',
  payment: 'Paste suspicious content',
  url: 'Enter suspicious URL',
}

export function MessageInput({
  contentType = 'sms',
  value,
  onChange,
  onClear,
  onValidate,
  disabled = false,
}) {
  const [showCounter, setShowCounter] = useState(true)

  const handleClear = () => {
    onClear()
    setShowCounter(false)
    setTimeout(() => setShowCounter(true), 150)
  }

  const limits = LIMITS[contentType]
  const placeholder = PLACEHOLDERS[contentType]
  const label = LABELS[contentType]

  const remaining = limits ? limits.max - value.length : null
  const isAtLimit = limits && value.length >= limits.max
  const isBelowMin = limits && value.length < limits.min && value.length > 0

  return (
    <div className="space-y-3">
      <label className="type-field-label" htmlFor="detection-input">
        {label}
      </label>

      <textarea
        id="detection-input"
        rows={8}
        cols={40}
        className={cn(
          'w-full rounded-lg border border-navy-700 bg-navy-950/50 px-4 py-3 text-base font-medium text-ink outline-none transition-colors focus:border-brand-500 focus:bg-navy-900/80 disabled:bg-navy-950/50 disabled:text-slate-500',
          disabled && 'cursor-not-allowed',
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        disabled={disabled}
      ></textarea>

      {disabled || (showCounter && limits) && (
        <div className="flex items-baseline justify-between text-xs text-slate-500">
          {value.length > 0 && (
            <span className={cn(
              'flex items-center gap-1',
              isAtLimit && 'text-danger-400',
              isBelowMin && 'text-warning-400',
            )}>
              {value.length}/{limits.max}
            </span>
          )}
          {remaining !== undefined && (
            <span>{remaining} remaining</span>
          )}
        </div>
      )}

      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/5 transition-colors duration-200"
          aria-label="Clear input"
        >
          <Loader2 className="size-3.5 animate-spin hidden" aria-hidden="true" />
          <span className="hidden sm:inline">Clear</span>
          <span className="sm:hidden">✕</span>
        </button>
      )}
    </div>
  )
}