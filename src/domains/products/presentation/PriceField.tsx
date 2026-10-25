import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

import { controlClasses, fieldDescribedBy } from '../../../shared/ui/fieldStyles.ts'
import { FormField } from '../../../shared/ui/FormField.tsx'

export interface PriceFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'type'
> {
  label: string
  error?: string | undefined
  hint?: string
}

/** Money input with a "$" prefix. Accepts plain decimals such as 24.99. */
export function PriceField({
  label,
  error,
  hint,
  required,
  ...inputProps
}: PriceFieldProps): React.JSX.Element {
  const id = useId()
  return (
    <FormField id={id} label={label} required={required === true} hint={hint}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
          $
        </span>
        <input
          {...inputProps}
          id={id}
          type="text"
          inputMode="decimal"
          aria-required={required === true || undefined}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={fieldDescribedBy(id, error, hint !== undefined)}
          className={`${controlClasses(error !== undefined)} pl-7`}
        />
        {/* Positioned so the form doesn't jump when the message appears. */}
        {error === undefined ? null : (
          <p id={`${id}-error`} className="absolute top-full left-0 mt-1 text-sm text-rose-600">
            {error}
          </p>
        )}
      </div>
    </FormField>
  )
}
