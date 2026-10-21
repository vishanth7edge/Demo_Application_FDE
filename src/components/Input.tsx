import { useId } from 'react'

export interface InputProps {
  label: string
  value: string
  type: 'text' | 'email' | 'password'
  error: string | null
  onChange: (value: string) => void
  name?: string | undefined
  autoComplete?: string | undefined
}

export default function Input({
  label,
  value,
  type,
  error,
  onChange,
  name,
  autoComplete,
}: InputProps): React.JSX.Element {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-label-large text-on-surface">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={error !== null}
        aria-describedby={error === null ? undefined : errorId}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        className={`rounded-md border bg-surface-container-lowest px-3 py-2 text-body-large text-on-surface focus-visible:ring-2 focus-visible:outline-none ${
          error === null
            ? 'border-outline focus-visible:ring-primary'
            : 'border-error focus-visible:ring-error'
        }`}
      />
      {error !== null && (
        <p id={errorId} className="text-body-small text-error">
          {error}
        </p>
      )}
    </div>
  )
}
