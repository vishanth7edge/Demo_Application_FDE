import { useId, useRef, useState } from 'react'
import { Link } from 'react-router'

import { useDismiss } from '../hooks/useDismiss.ts'
import { MoreVerticalIcon } from './icons/ProductIcons.tsx'

export interface ProductCardMenuProps {
  productId: number
  productTitle: string
  onDelete: () => void
}

const ITEM =
  'block w-full px-4 py-2 text-left text-body-medium hover:bg-sidebar-active focus-visible:bg-sidebar-active focus-visible:outline-none'

// The ⋮ button on a product card: View, Edit and Delete. Closes on Escape or a click outside.
// z-20 keeps it above the card's full-size link; z-30 while open lifts the list over the next cards.
export function ProductCardMenu({
  productId,
  productTitle,
  onDelete,
}: ProductCardMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useDismiss(rootRef, open, () => {
    setOpen(false)
  })

  return (
    <div ref={rootRef} className={`relative ${open ? 'z-30' : 'z-20'}`}>
      <button
        type="button"
        aria-label={`Actions for ${productTitle}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setOpen((value) => !value)
        }}
        className="flex size-7 items-center justify-center rounded-full bg-sidebar-active/90 text-brand hover:bg-sidebar focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <MoreVerticalIcon className="size-4" />
      </button>
      {open && (
        <ul
          id={listId}
          className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-outline bg-surface py-1 shadow-lg"
        >
          <li>
            <Link to={`/products/${String(productId)}`} className={ITEM}>
              View details
            </Link>
          </li>
          <li>
            <Link to={`/products/${String(productId)}/edit`} className={ITEM}>
              Edit
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              className={`${ITEM} text-error`}
            >
              Delete
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
