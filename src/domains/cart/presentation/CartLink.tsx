import { NavLink } from 'react-router'

import { CartIcon } from '../../../components/icons/ProductIcons.tsx'
import { useAppSelector } from '../../../hooks/useAppSelector.ts'
import { selectCartCount } from '../application/index.ts'

export type CartLinkProps = Record<string, never>

// Header cart icon with the number of pieces in the cart.
export function CartLink(): React.JSX.Element {
  const count = useAppSelector(selectCartCount)

  return (
    <NavLink
      to="/cart"
      aria-label={count === 0 ? 'Cart, empty' : `Cart, ${String(count)} items`}
      className="relative flex size-11 items-center justify-center rounded-lg bg-sidebar-active text-accent hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none aria-[current=page]:ring-2 aria-[current=page]:ring-brand"
    >
      <CartIcon className="size-6" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-label-small text-brand-foreground"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </NavLink>
  )
}
