import { buttonClasses } from '../../../components/fieldStyles.ts'
import { CartIcon } from '../../../components/icons/ProductIcons.tsx'
import { QuantityStepper } from '../../../components/QuantityStepper.tsx'
import { useAppDispatch } from '../../../hooks/useAppDispatch.ts'
import { useAppSelector } from '../../../hooks/useAppSelector.ts'
import {
  addToCart,
  decrementQuantity,
  selectCartQuantity,
  MAX_CART_QUANTITY,
} from '../application/index.ts'

import type { CartProduct } from '../application/index.ts'

export interface AddToCartButtonProps {
  product: CartProduct
  size?: 'small' | 'large' | undefined
}

// "Add to cart" until the product is in the cart, then a − n + stepper. Reads the quantity from
// the Redux store (useAppSelector) and changes it by dispatching cart actions (useAppDispatch).
export function AddToCartButton({
  product,
  size = 'small',
}: AddToCartButtonProps): React.JSX.Element {
  const dispatch = useAppDispatch()
  const quantity = useAppSelector((state) => selectCartQuantity(state, product.id))
  const add = (): void => {
    dispatch(addToCart(product))
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        aria-label={`Add ${product.title} to cart`}
        onClick={add}
        className={`${buttonClasses('secondary')} ${size === 'small' ? 'h-10 w-full py-0' : ''}`}
      >
        <CartIcon className="size-5" />
        Add to cart
      </button>
    )
  }
  return (
    <QuantityStepper
      quantity={quantity}
      itemName={product.title}
      size={size}
      fullWidth={size === 'small'}
      canIncrement={quantity < MAX_CART_QUANTITY}
      onIncrement={add}
      onDecrement={() => {
        dispatch(decrementQuantity(product.id))
      }}
    />
  )
}
