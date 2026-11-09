import { ChevronDown } from 'lucide-react'
import { useId } from 'react'
import { cn } from '../../utils/cn.js'
import { Field } from './Field.jsx'
import { controlBase, controlBorder, describedBy } from './fieldStyles.js'

export function SelectField({
  label,
  error,
  hint,
  id,
  required = false,
  className,
  containerClassName,
  children,
  ...props
}) {
  const autoId = useId()
  const selectId = id ?? autoId

  return (
    <Field
      label={label}
      htmlFor={selectId}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <div className="relative">
        <select
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, error, hint)}
          className={cn(
            controlBase,
            'h-10 appearance-none pl-3 pr-9',
            error ? controlBorder.error : controlBorder.normal,
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
      </div>
    </Field>
  )
}
