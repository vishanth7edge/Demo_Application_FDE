import { fieldControlClasses } from './fieldStyles.ts'
import { FormField } from './FormField.tsx'

export interface InputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | undefined
  name?: string | undefined
  autoComplete?: string | undefined
  placeholder?: string | undefined
  // e.g. "decimal" for prices: a numeric keyboard on phones while keeping a text value.
  inputMode?: 'text' | 'decimal' | 'numeric' | undefined
  error?: string | undefined
  disabled?: boolean | undefined
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  name,
  autoComplete,
  placeholder,
  inputMode,
  error,
  disabled,
}: InputProps): React.JSX.Element {
  return (
    <FormField label={label} error={error}>
      {(control) => (
        <input
          {...control}
          name={name}
          type={type}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          inputMode={inputMode}
          onChange={(event) => {
            onChange(event.target.value)
          }}
          className={fieldControlClasses(error !== undefined)}
        />
      )}
    </FormField>
  )
}
