import type { ReactNode } from 'react'

export interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  error?: string | undefined
  hint?: ReactNode
  /** Rendered at the right of the label row, e.g. a character counter. */
  aside?: ReactNode
  children: ReactNode
}

/** Label + control + hint/error wrapper. Controls use `fieldDescribedBy(id, …)` for aria. */
export function FormField({
  id,
  label,
  required = false,
  error,
  hint,
  aside,
  children,
}: FormFieldProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
          {required ? (
            <span className="ml-0.5 text-rose-600" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {aside}
      </div>
      {children}
      {error === undefined ? null : (
        <p id={`${id}-error`} className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {hint === undefined || error !== undefined ? null : (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  )
}
