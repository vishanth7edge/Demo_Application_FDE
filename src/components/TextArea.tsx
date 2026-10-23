import { fieldControlClasses } from './fieldStyles.ts'
import { FormField } from './FormField.tsx'

export interface TextAreaProps {
  label: string
  value: string
  onChange: (value: string) => void
  name?: string | undefined
  placeholder?: string | undefined
  rows?: number | undefined
  error?: string | undefined
  disabled?: boolean | undefined
}

export function TextArea({
  label,
  value,
  onChange,
  name,
  placeholder,
  rows = 5,
  error,
  disabled,
}: TextAreaProps): React.JSX.Element {
  return (
    <FormField label={label} error={error}>
      {(control) => (
        <textarea
          {...control}
          name={name}
          value={value}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value)
          }}
          className={`${fieldControlClasses(error !== undefined)} resize-y`}
        />
      )}
    </FormField>
  )
}
