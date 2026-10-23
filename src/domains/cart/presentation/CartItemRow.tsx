import { Link } from 'react-router'

import { TrashIcon } from '../../../components/icons/ProductIcons.tsx'
import { ProductImage } from '../../../components/ProductImage.tsx'
import { QuantityStepper } from '../../../components/QuantityStepper.tsx'
import { formatPrice } from '../../../helpers/productFormat.ts'
import { useAppDispatch } from '../../../hooks/useAppDispatch.ts'
import {
  addToCart,
  decrementQuantity,
  removeFromCart,
  MAX_CART_QUANTITY,
} from '../application/index.ts'

import type { CartItem } from '../application/index.ts'

export interface CartItemRowProps {
  item: CartItem
}

// One line in the cart: picture, name, unit price, − n +, line total and remove.
export function CartItemRow({ item }: CartItemRowProps): React.JSX.Element {
  const dispatch = useAppDispatch()
  const { quantity, ...product } = item

  return (
    <li className="flex flex-wrap items-center gap-4 py-4">
      <ProductImage
        key={item.thumbnail}
        src={item.thumbnail}
        alt=""
        className="size-20 shrink-0 rounded-lg"
      />
      <div className="min-w-40 flex-1">
        <Link
          to={`/products/${String(item.id)}`}
          className="text-label-large hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          {item.title}
        </Link>
        <p className="mt-1 text-body-small text-on-surface-muted">{formatPrice(item.price)} each</p>
      </div>
      <QuantityStepper
        quantity={quantity}
        itemName={item.title}
        canIncrement={quantity < MAX_CART_QUANTITY}
        onIncrement={() => {
          dispatch(addToCart(product))
        }}
        onDecrement={() => {
          dispatch(decrementQuantity(item.id))
        }}
      />
      <p className="w-24 text-right text-title-small text-brand">
        {formatPrice(Math.round(item.price * quantity * 100) / 100)}
      </p>
      <button
        type="button"
        aria-label={`Remove ${item.title} from cart`}
        onClick={() => {
          dispatch(removeFromCart(item.id))
        }}
        className="flex size-9 items-center justify-center rounded-lg text-error hover:bg-error/5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <TrashIcon className="size-5" />
      </button>
    </li>
  )
}
