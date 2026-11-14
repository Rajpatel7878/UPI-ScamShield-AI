"use client";

import { useId } from 'react'
import { cn } from '../../utils/cn.js'

export function CheckboxField({
  label,
  description,
  error,
  id,
  className,
  ...props
}) {
  const autoId = useId()
  const checkboxId = id ?? autoId
  const descriptionId = description
    ? `${checkboxId}-description`
    : error
      ? `${checkboxId}-error`
      : undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-start gap-2.5">
        <input
          id={checkboxId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
          className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-white/20 bg-white/[0.03] accent-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        <div className="flex flex-col gap-0.5">
          <label htmlFor={checkboxId} className="type-field-label cursor-pointer">
            {label}
          </label>
          {description && (
            <p id={`${checkboxId}-description`} className="type-caption">
              {description}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p id={`${checkboxId}-error`} role="alert" className="text-xs text-danger-400">
          {error}
        </p>
      )}
    </div>
  )
}
