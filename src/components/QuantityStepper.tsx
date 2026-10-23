import { MinusIcon } from './icons/ProductIcons.tsx'
import { PlusIcon } from './icons/UiIcons.tsx'

export interface QuantityStepperProps {
  quantity: number
  // Used in the button names: "Remove one RCC Cement".
  itemName: string
  onIncrement: () => void
  onDecrement: () => void
  canIncrement?: boolean | undefined
  size?: 'small' | 'large' | undefined
  // Stretch to the container (product cards), matching the Add to cart button.
  fullWidth?: boolean | undefined
}

const STEP =
  'flex items-center justify-center rounded-md text-brand hover:bg-sidebar focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:text-outline'

// − 2 + control for cart quantities.
export function QuantityStepper({
  quantity,
  itemName,
  onIncrement,
  onDecrement,
  canIncrement = true,
  size = 'small',
  fullWidth = false,
}: QuantityStepperProps): React.JSX.Element {
  const box = size === 'small' ? 'size-8' : 'size-10'

  return (
    <div
      className={`items-center gap-1 rounded-lg border border-brand bg-surface p-0.5 ${fullWidth ? 'flex h-10 w-full justify-between' : 'inline-flex'}`}
    >
      <button
        type="button"
        aria-label={`Remove one ${itemName}`}
        onClick={onDecrement}
        className={`${STEP} ${box}`}
      >
        <MinusIcon className="size-4" />
      </button>
      <span aria-live="polite" className="min-w-8 text-center text-label-large">
        {quantity}
        <span className="sr-only"> in cart</span>
      </span>
      <button
        type="button"
        aria-label={`Add one more ${itemName}`}
        disabled={!canIncrement}
        onClick={onIncrement}
        className={`${STEP} ${box}`}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  )
}
