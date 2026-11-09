import { cn } from '../../utils/cn.js'

/**
 * Shared label / hint / error layout for every form control.
 * The control itself owns `aria-describedby`; ids follow the `${id}-error`
 * and `${id}-hint` convention from `fieldStyles.js`.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  className,
  children,
}) {
  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="type-field-label">
          {label}
          {required && (
            <span className="ml-0.5 text-danger-400" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-danger-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${htmlFor}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
