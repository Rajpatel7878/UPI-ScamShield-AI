/**
 * Shared control styling used by Input, Textarea and Select.
 * Premium design system — glassmorphism inputs with neon focus states.
 */
export const controlBase =
  'w-full rounded-xl border bg-white/[0.03] text-sm text-ink transition-colors duration-300 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'

export const controlBorder = {
  normal:
    'border-white/10 hover:border-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20',
  error:
    'border-danger-500/50 hover:border-danger-500/70 focus:border-danger-500 focus:ring-1 focus:ring-danger-500/25',
  brand:
    'border-brand-500/30 hover:border-brand-500/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30',
}

export function describedBy(id, error, hint) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}
