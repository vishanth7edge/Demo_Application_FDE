import { formatPrice } from '../helpers/productFormat.ts'
import { GlassIcon, RecycleIcon } from './icons/ProductIcons.tsx'

import type { Product } from '../services/productService.ts'

export interface ProductDetailsListProps {
  product: Product
}

const NOT_AVAILABLE = 'n/a'

interface DetailProps {
  label: string
  value: string
  wide?: boolean | undefined
  // Shown after the label (Eco Friendly, Handle with Care).
  icon?: React.ReactNode
}

function Detail({ label, value, wide, icon }: DetailProps): React.JSX.Element {
  return (
    <div className={wide === true ? 'col-span-full' : ''}>
      <dt className="flex items-center gap-2 text-body-small text-on-surface-muted">
        {label}
        {icon}
      </dt>
      <dd className="mt-1 text-body-medium">{value === '' ? NOT_AVAILABLE : value}</dd>
    </div>
  )
}

// Figma "Product Basic Details". DummyJSON has no form, safety, UOM, margin, type, colour,
// brochure or care flags, so those show "n/a" until the real API provides them.
export function ProductDetailsList({ product }: ProductDetailsListProps): React.JSX.Element {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
      <Detail label="Product Name" value={product.title} wide />
      <Detail label="Product Description" value={product.description} wide />
      <Detail label="Category" value={product.category} />
      <Detail label="Brand" value={product.brand} />
      <Detail label="Form" value="" />
      <Detail label="Safety" value="" />
      <Detail label="UOM" value="" />
      <Detail label="Rate per Unit" value={product.price > 0 ? formatPrice(product.price) : ''} />
      <Detail label="Market Selling Price" value="" />
      <Detail label="Sale Profit Margin" value="" />
      <Detail label="Product Type" value="" />
      <Detail label="Product Size" value={product.size} />
      <Detail label="Product Color" value="" />
      <Detail label="Document/Brochure" value="" wide />
      <Detail label="Eco Friendly" value="" icon={<RecycleIcon className="size-5 text-accent" />} />
      <Detail
        label="Handle with Care"
        value=""
        icon={<GlassIcon className="size-5 text-accent" />}
      />
    </dl>
  )
}
