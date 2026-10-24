import { useId } from 'react'

import { ChevronDownIcon } from './Icons.tsx'

import FieldError from './FieldError.tsx'

export interface SelectFieldProps {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
  error?: string | null | undefined
}

export default function SelectField({
  label,
  value,
  options,
  onChange,
  error = null,
}: SelectFieldProps): React.JSX.Element {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="relative flex flex-col gap-1">
      <label
        htmlFor={id}
        className="absolute -top-2 left-3 z-10 bg-surface px-1 text-label-small text-on-surface-variant"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        required
        aria-invalid={error !== null}
        aria-describedby={error === null ? undefined : errorId}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        className={`w-full appearance-none rounded-md border bg-transparent px-4 py-3 pr-10 text-body-medium focus-visible:ring-2 focus-visible:outline-none ${
          value === '' ? 'text-on-surface-variant' : 'text-on-surface'
        } ${error === null ? 'border-outline focus-visible:ring-primary' : 'border-error focus-visible:ring-error'}`}
      >
        <option value="" disabled>
          Select
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute top-3 right-3 text-on-surface">
        <ChevronDownIcon />
      </span>
      {error !== null && <FieldError id={errorId} message={error} />}
    </div>
  )
}
