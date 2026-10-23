import { useId, useState } from 'react'
import { Link } from 'react-router'

import emptyVendorsUrl from '../assets/empty-vendors.svg'
import { buttonClasses } from './fieldStyles.ts'
import { VendorsIcon } from './icons/NavIcons.tsx'
import { InboxDownIcon } from './icons/ProductIcons.tsx'
import { SearchInput } from './SearchInput.tsx'

export type VendorsPanelProps = Record<string, never>

const TABS = [
  {
    id: 'assigned',
    label: 'Vendor Assigned',
    empty: 'Add Vendors to Expand Your Business Network',
  },
  { id: 'requests', label: 'Assignment Request', empty: 'No assignment requests yet' },
] as const

type TabId = (typeof TABS)[number]['id']

// Bottom of the Figma "Product Detail" frame. There is no vendor API yet, so both tabs show their
// empty state and "Assign Vendors" leads to the Vendors page.
export function VendorsPanel(): React.JSX.Element {
  const [tab, setTab] = useState<TabId>('assigned')
  const [search, setSearch] = useState('')
  const baseId = useId()
  const active = TABS.find((item) => item.id === tab) ?? TABS[0]

  return (
    <section aria-label="Vendors" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Vendors" className="flex border-b border-outline">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${baseId}-${item.id}`}
              aria-selected={item.id === tab}
              aria-controls={`${baseId}-panel`}
              onClick={() => {
                setTab(item.id)
              }}
              className={`flex items-center gap-2 px-4 py-2 text-body-medium focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                item.id === tab ? '-mb-px border-b-2 border-brand text-brand' : ''
              }`}
            >
              {item.id === 'assigned' ? (
                <VendorsIcon className="size-5 text-accent" />
              ) : (
                <InboxDownIcon className="size-5" />
              )}
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            label="Search vendors"
            placeholder="Search"
            value={search}
            onChange={setSearch}
            className="w-full sm:w-48"
          />
          <Link to="/vendors" className={`${buttonClasses('primary')} whitespace-nowrap`}>
            Assign Vendors
          </Link>
        </div>
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-${tab}`}
        className="flex flex-col items-center gap-6 py-6 text-center"
      >
        <img src={emptyVendorsUrl} alt="" width={240} height={200} className="h-auto w-48" />
        <p className="font-poppins text-title-medium">{active.empty}</p>
      </div>
    </section>
  )
}
