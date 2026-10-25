import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '../application/index.ts'
import { Button } from '../../../shared/ui/Button.tsx'
import { controlClasses } from '../../../shared/ui/fieldStyles.ts'
import { IconSearch, IconX } from '../../../shared/ui/Icons.tsx'
import { SelectField } from '../../../shared/ui/SelectField.tsx'

export interface ProductFiltersProps {
  searchText: string
  category: string
  status: string
  showClear: boolean
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: string) => void
  onClear: () => void
}

export function ProductFilters({
  searchText,
  category,
  status,
  showClear,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onClear,
}: ProductFiltersProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3 border-b border-line p-4 sm:p-5 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          aria-label="Search products"
          placeholder="Search by product name or SKU"
          value={searchText}
          onChange={(event) => {
            onSearchChange(event.target.value)
          }}
          className={`${controlClasses(false)} pl-9`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
        <SelectField
          label="Category"
          hideLabel
          placeholder="All categories"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(event) => {
            onCategoryChange(event.target.value)
          }}
          className="sm:w-48"
        />
        <SelectField
          label="Status"
          hideLabel
          placeholder="All statuses"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(event) => {
            onStatusChange(event.target.value)
          }}
          className="sm:w-40"
        />
        {showClear ? (
          <Button
            variant="ghost"
            onClick={onClear}
            icon={<IconX className="size-4" />}
            className="col-span-2"
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  )
}
