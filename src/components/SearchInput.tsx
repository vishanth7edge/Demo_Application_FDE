import { useId } from 'react'

import { SearchIcon } from './icons/UiIcons.tsx'

export interface SearchInputProps {
  // Read by screen readers; not shown.
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string | undefined
  className?: string | undefined
}

export function SearchInput({
  label,
  value,
  onChange,
  placeholder,
  className = '',
}: SearchInputProps): React.JSX.Element {
  const id = useId()

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-on-surface-muted" />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        className="w-full rounded-lg border border-outline bg-surface py-2.5 pr-3 pl-10 text-body-medium placeholder:text-on-surface-muted focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      />
    </div>
  )
}
