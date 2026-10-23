import { Link, useParams } from 'react-router'

import { PencilIcon } from '../components/icons/ProductIcons.tsx'
import { ImageCarousel } from '../components/ImageCarousel.tsx'
import { ProductDetailsList } from '../components/ProductDetailsList.tsx'
import { ProductLoadState } from '../components/ProductLoadState.tsx'
import { ProductDetailSkeleton } from '../components/ProductSkeletons.tsx'
import { VendorsPanel } from '../components/VendorsPanel.tsx'
import { AddToCartButton } from '../domains/cart/index.ts'
import { parseProductId } from '../helpers/flashMessage.ts'
import { useProduct } from '../hooks/useProduct.ts'

import type { Product } from '../services/productService.ts'

export type ProductDetailPageProps = Record<string, never>

const SECTION_HEADING = 'border-b border-outline pb-3 font-poppins text-title-small'

interface DetailContentProps {
  product: Product
}

function DetailContent({ product }: DetailContentProps): React.JSX.Element {
  const images = product.images.length > 0 ? product.images : [product.thumbnail]

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-poppins text-title-large font-medium">Product Detail</h1>
        <div className="flex flex-wrap items-center justify-end gap-4">
          <Link
            to={`/products/${String(product.id)}/edit`}
            className="flex items-center gap-1 text-label-large text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <PencilIcon className="size-4" />
            Edit Product
          </Link>
          <AddToCartButton product={product} size="large" />
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className={SECTION_HEADING}>Product Image</h2>
          <ImageCarousel images={images} title={product.title} />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className={`${SECTION_HEADING} font-semibold`}>Product Basic Details</h2>
          <ProductDetailsList product={product} />
        </div>
      </div>
      <hr className="border-dashed border-outline" />
      <VendorsPanel />
    </>
  )
}

interface ProductDetailProps {
  productId: number
}

function ProductDetail({ productId }: ProductDetailProps): React.JSX.Element {
  const load = useProduct(productId)
  return (
    <ProductLoadState load={load} skeleton={<ProductDetailSkeleton />}>
      {(product) => <DetailContent product={product} />}
    </ProductLoadState>
  )
}

export function ProductDetailPage(): React.JSX.Element {
  const productId = parseProductId(useParams()['id'])

  return (
    <section className="flex flex-col gap-6 rounded-xl bg-surface p-4 md:p-6">
      {productId === null ? (
        <ProductLoadState load={null} skeleton={null}>
          {() => null}
        </ProductLoadState>
      ) : (
        <ProductDetail key={productId} productId={productId} />
      )}
    </section>
  )
}
