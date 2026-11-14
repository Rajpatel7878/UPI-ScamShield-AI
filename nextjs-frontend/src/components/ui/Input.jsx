"use client";

import { Search, X } from 'lucide-react'
import { useId } from 'react'
import { cn } from '../../utils/cn.js'
import { Field } from './Field.jsx'
import { controlBase, controlBorder, describedBy } from './fieldStyles.js'

export function InputField({
  label,
  error,
  hint,
  icon: Icon,
  id,
  required = false,
  className,
  containerClassName,
  ...props
}) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <Field
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
        )}
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          className={cn(
            controlBase,
            'h-10',
            Icon ? 'pl-9 pr-3' : 'px-3',
            error ? controlBorder.error : controlBorder.normal,
            className,
          )}
          {...props}
        />
      </div>
    </Field>
  )
}

export function SearchInput({
  label = 'Search',
  value = '',
  onChange,
  onClear,
  placeholder = 'Search…',
  hint,
  error,
  id,
  className,
  containerClassName,
  ...props
}) {
  const autoId = useId()
  const inputId = id ?? autoId

  const clear = () => {
    onChange?.('')
    onClear?.()
  }

  return (
    <Field
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          className={cn(
            controlBase,
            'h-10 pl-9 pr-10',
            '[&::-webkit-search-cancel-button]:hidden',
            error ? controlBorder.error : controlBorder.normal,
            className,
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </Field>
  )
}
