import { fieldControlClasses } from './fieldStyles.ts'
import { FormField } from './FormField.tsx'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly SelectOption[]
  // Shown as the empty first choice.
  placeholder: string
  name?: string | undefined
  error?: string | undefined
  disabled?: boolean | undefined
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  name,
  error,
  disabled,
}: SelectProps): React.JSX.Element {
  return (
    <FormField label={label} error={error}>
      {(control) => (
        <select
          {...control}
          name={name}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value)
          }}
          className={`${fieldControlClasses(error !== undefined)} ${value === '' ? 'text-on-surface-muted' : ''}`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  )
}
