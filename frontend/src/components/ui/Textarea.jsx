import { useId } from 'react'
import { cn } from '../../utils/cn.js'
import { Field } from './Field.jsx'
import { controlBase, controlBorder, describedBy } from './fieldStyles.js'

export function TextAreaField({
  label,
  error,
  hint,
  id,
  rows = 4,
  required = false,
  className,
  containerClassName,
  ...props
}) {
  const autoId = useId()
  const textareaId = id ?? autoId

  return (
    <Field
      label={label}
      htmlFor={textareaId}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, error, hint)}
        className={cn(
          controlBase,
          'resize-y px-3 py-2.5',
          error ? controlBorder.error : controlBorder.normal,
          className,
        )}
        {...props}
      />
    </Field>
  )
}
