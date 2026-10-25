import { useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

import { controlClasses, fieldDescribedBy } from '../../../shared/ui/fieldStyles.ts'
import { FormField } from '../../../shared/ui/FormField.tsx'
import { IconEye, IconEyeOff } from '../../../shared/ui/Icons.tsx'

export interface PasswordFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'type'
> {
  label: string
  error?: string | undefined
  aside?: ReactNode
}

export function PasswordField({
  label,
  error,
  aside,
  required,
  ...inputProps
}: PasswordFieldProps): React.JSX.Element {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <FormField id={id} label={label} required={required === true} error={error} aside={aside}>
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          type={visible ? 'text' : 'password'}
          aria-required={required === true || undefined}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={fieldDescribedBy(id, error)}
          className={`${controlClasses(error !== undefined)} pr-11`}
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => {
            setVisible((current) => !current)
          }}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-slate-400 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </FormField>
  )
}
