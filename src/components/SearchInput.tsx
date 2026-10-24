import { SearchIcon } from './Icons.tsx'

export interface SearchInputProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export default function SearchInput({
  label,
  value,
  onChange,
}: SearchInputProps): React.JSX.Element {
  return (
    <div className="relative">
      <input
        type="search"
        aria-label={label}
        placeholder="Search"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        className="w-full rounded-lg border border-outline bg-surface px-4 py-3 pr-11 text-body-medium text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-on-surface">
        <SearchIcon />
      </span>
    </div>
  )
}
