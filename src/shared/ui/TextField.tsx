import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

import { controlClasses, fieldDescribedBy } from './fieldStyles.ts'
import { FormField } from './FormField.tsx'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string | undefined
  hint?: ReactNode
  aside?: ReactNode
}

export function TextField({
  label,
  error,
  hint,
  aside,
  required,
  className = '',
  ...inputProps
}: TextFieldProps): React.JSX.Element {
  const id = useId()
  return (
    <FormField
      id={id}
      label={label}
      required={required === true}
      error={error}
      hint={hint}
      aside={aside}
    >
      <input
        {...inputProps}
        id={id}
        aria-required={required === true || undefined}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={fieldDescribedBy(id, error, hint !== undefined)}
        className={`${controlClasses(error !== undefined)} ${className}`}
      />
    </FormField>
  )
}
