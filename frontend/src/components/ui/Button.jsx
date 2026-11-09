import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const BASE =
  'inline-flex select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:pointer-events-none disabled:opacity-50'

const VARIANTS = {
  primary:
    'bg-brand-500 text-navy-950 shadow-lg shadow-brand-500/20 hover:bg-brand-400 active:bg-brand-600',
  secondary:
    'border border-navy-700 bg-navy-800 text-ink hover:border-brand-500/40 hover:bg-navy-700',
  outline:
    'border border-brand-500/40 bg-transparent text-brand-300 hover:border-brand-400 hover:bg-brand-500/10',
  danger:
    'bg-danger-500 text-white shadow-lg shadow-danger-500/20 hover:bg-danger-400 active:bg-danger-500',
  ghost: 'bg-transparent text-muted hover:bg-white/5 hover:text-ink',
}

const SIZES = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2.5 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {isLoading ? loadingText || children : children}
      {!isLoading && rightIcon}
    </button>
  )
}

const ICON_SIZES = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-12',
}

export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(BASE, VARIANTS[variant], 'p-0', ICON_SIZES[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

export function PrimaryButton(props) {
  return <Button variant="primary" {...props} />
}

export function SecondaryButton(props) {
  return <Button variant="secondary" {...props} />
}

export function OutlineButton(props) {
  return <Button variant="outline" {...props} />
}

export function DangerButton(props) {
  return <Button variant="danger" {...props} />
}
