import { useId, useState } from 'react'

import Button from '../Button.tsx'
import EmptyState from '../EmptyState.tsx'
import SearchInput from '../SearchInput.tsx'

const TABS = ['Vendor Assigned', 'Assignment Request'] as const

export default function VendorTabs(): React.JSX.Element {
  const baseId = useId()
  const [active, setActive] = useState(0)
  const [search, setSearch] = useState('')

  const moveFocus = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (delta !== 0) {
      setActive((active + delta + TABS.length) % TABS.length)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          role="tablist"
          aria-label="Vendors"
          className="flex gap-4 border-b border-outline-variant"
        >
          {TABS.map((tab, index) => (
            <button
              key={tab}
              id={`${baseId}-tab-${String(index)}`}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-controls={`${baseId}-panel`}
              tabIndex={index === active ? 0 : -1}
              onClick={() => {
                setActive(index)
              }}
              onKeyDown={moveFocus}
              className={`-mb-px border-b-2 px-2 py-2 text-label-large focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                index === active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput label="Search vendors" value={search} onChange={setSearch} />
          <Button disabled>Assign Vendors</Button>
        </div>
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${String(active)}`}
      >
        <EmptyState title="Add Vendors to Expand Your Business Network" />
      </div>
    </section>
  )
}
