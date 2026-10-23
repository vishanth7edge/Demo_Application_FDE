import { useState } from 'react'
import { Link } from 'react-router'

import { Button } from '../components/Button.tsx'
import { EmptyState } from '../components/EmptyState.tsx'
import { buttonClasses } from '../components/fieldStyles.ts'
import { CartIcon } from '../components/icons/ProductIcons.tsx'
import { Modal } from '../components/Modal.tsx'
import { formatPrice } from '../helpers/productFormat.ts'
import { useAppDispatch } from '../hooks/useAppDispatch.ts'
import { useAppSelector } from '../hooks/useAppSelector.ts'
import {
  CartItemRow,
  clearCart,
  selectCartCount,
  selectCartItems,
  selectCartTotal,
} from '../domains/cart/index.ts'

export type CartPageProps = Record<string, never>

// Everything here comes from the Redux store; nothing is sent to the API yet.
export function CartPage(): React.JSX.Element {
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectCartItems)
  const count = useAppSelector(selectCartCount)
  const total = useAppSelector(selectCartTotal)
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-poppins text-title-large font-medium">Cart</h1>
        {items.length > 0 && (
          <Button
            variant="danger"
            onClick={() => {
              setConfirmClear(true)
            }}
          >
            Clear cart
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Add products from the product list to see them here."
          illustration={<CartIcon className="mx-auto size-24 text-outline" />}
          action={
            <Link to="/products" className={`${buttonClasses('primary')} w-full`}>
              Browse products
            </Link>
          }
        />
      ) : (
        <>
          <ul aria-label="Cart items" className="divide-y divide-outline">
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </ul>
          <div className="flex flex-col items-end gap-1 border-t border-outline pt-4">
            <p className="text-body-medium text-on-surface-muted">
              {count === 1 ? '1 item' : `${String(count)} items`}
            </p>
            <p className="font-poppins text-title-large">
              Total <span className="font-semibold text-brand">{formatPrice(total)}</span>
            </p>
            <Link to="/products" className="mt-2 text-label-large text-brand hover:underline">
              Continue shopping
            </Link>
          </div>
        </>
      )}

      {confirmClear && (
        <Modal
          tone="warning"
          title="Clear the cart ?"
          description="All products will be removed from your cart."
          closeLabel="Close"
          onClose={() => {
            setConfirmClear(false)
          }}
        >
          <Button
            onClick={() => {
              setConfirmClear(false)
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              dispatch(clearCart())
              setConfirmClear(false)
            }}
          >
            Clear
          </Button>
        </Modal>
      )}
    </section>
  )
}
