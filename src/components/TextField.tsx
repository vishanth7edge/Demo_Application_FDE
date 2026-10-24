import { useId } from 'react'

import FieldError from './FieldError.tsx'

export interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null | undefined
  multiline?: boolean
  readOnly?: boolean
  required?: boolean
  inputMode?: 'text' | 'decimal'
}

export default function TextField({
  label,
  value,
  onChange,
  error = null,
  multiline = false,
  readOnly = false,
  required = false,
  inputMode = 'text',
}: TextFieldProps): React.JSX.Element {
  const id = useId()
  const errorId = `${id}-error`
  const shared = {
    id,
    value,
    readOnly,
    required,
    'aria-invalid': error !== null,
    'aria-describedby': error === null ? undefined : errorId,
    className: `w-full rounded-md border bg-transparent px-4 py-3 text-body-medium text-on-surface focus-visible:ring-2 focus-visible:outline-none ${
      error === null
        ? 'border-outline focus-visible:ring-primary'
        : 'border-error focus-visible:ring-error'
    }`,
  }

  return (
    <div className="relative flex flex-col gap-1">
      <label
        htmlFor={id}
        className="absolute -top-2 left-3 bg-surface px-1 text-label-small text-on-surface-variant"
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          {...shared}
          rows={6}
          onChange={(event) => {
            onChange(event.target.value)
          }}
        />
      ) : (
        <input
          {...shared}
          type="text"
          inputMode={inputMode}
          onChange={(event) => {
            onChange(event.target.value)
          }}
        />
      )}
      {error !== null && <FieldError id={errorId} message={error} />}
    </div>
  )
}
