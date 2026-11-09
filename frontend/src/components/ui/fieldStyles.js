/** Shared control styling used by Input, Textarea and Select. */
export const controlBase =
  'w-full rounded-field border bg-navy-950/60 text-sm text-ink transition-colors duration-200 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'

export const controlBorder = {
  normal:
    'border-navy-700 hover:border-navy-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
  error:
    'border-danger-500/70 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/25',
}

export function describedBy(id, error, hint) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}
