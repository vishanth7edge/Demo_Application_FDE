import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

import { controlClasses, fieldDescribedBy } from './fieldStyles.ts'
import { FormField } from './FormField.tsx'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  options: readonly SelectOption[]
  /** Optional first option with an empty value, e.g. "Select a category". */
  placeholder?: string
  error?: string | undefined
  /** Visually hides the label (it stays available to assistive technology). */
  hideLabel?: boolean
}

export function SelectField({
  label,
  options,
  placeholder,
  error,
  hideLabel = false,
  required,
  className = '',
  ...selectProps
}: SelectFieldProps): React.JSX.Element {
  const id = useId()
  const select = (
    <select
      {...selectProps}
      id={id}
      aria-required={required === true || undefined}
      aria-invalid={error !== undefined || undefined}
      aria-describedby={fieldDescribedBy(id, error)}
      className={`${controlClasses(error !== undefined)} pr-8 ${className}`}
    >
      {placeholder === undefined ? null : <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )

  if (hideLabel) {
    return (
      <div>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        {select}
      </div>
    )
  }
  return (
    <FormField id={id} label={label} required={required === true} error={error}>
      {select}
    </FormField>
  )
}
