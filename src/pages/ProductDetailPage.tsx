import { Link, useParams } from 'react-router'

import DetailItem from '../components/products/DetailItem.tsx'
import ProductGallery from '../components/products/ProductGallery.tsx'
import { useProduct } from '../components/products/useProduct.ts'
import VendorTabs from '../components/products/VendorTabs.tsx'
import type { Product } from '../services/productService.ts'

function ProductDetail({ product }: { product: Product }): React.JSX.Element {
  const images = product.images.length > 0 ? product.images : [product.thumbnail]

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-xl bg-surface p-4 md:p-5">
        <h1 className="text-headline-small text-on-surface">Product Detail</h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="border-b border-outline-variant pb-2 text-title-small text-on-surface">
              Product Image
            </h2>
            <ProductGallery title={product.title} images={images.filter((image) => image !== '')} />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="border-b border-outline-variant pb-2 text-title-small text-on-surface">
              Product Basic Details
            </h2>
            <dl className="flex flex-col gap-4">
              <DetailItem label="Product Name" value={product.title} />
              <DetailItem label="Product Description" value={product.description} />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <DetailItem label="Category" value={product.category} />
                <DetailItem label="Brand" value={product.brand} />
                <DetailItem label="Rate per Unit" value={`$${String(product.price)}`} />
                <DetailItem label="Product Size" value={product.size} />
              </div>
            </dl>
          </div>
        </div>
      </section>
      <VendorTabs />
    </div>
  )
}

export default function ProductDetailPage(): React.JSX.Element {
  const { id } = useParams()
  const productId = Number(id)

  if (!Number.isInteger(productId) || productId <= 0) {
    return <ProductMessage message="This product does not exist." />
  }
  return <LoadedProduct productId={productId} />
}

function LoadedProduct({ productId }: { productId: number }): React.JSX.Element {
  const result = useProduct(productId)
  if (result === null) {
    return (
      <p role="status" className="py-16 text-center text-body-medium text-on-surface-variant">
        Loading product…
      </p>
    )
  }
  return result.error ? (
    <ProductMessage message={result.message} />
  ) : (
    <ProductDetail product={result.data} />
  )
}

function ProductMessage({ message }: { message: string }): React.JSX.Element {
  return (
    <section className="flex flex-col items-center gap-3 rounded-xl bg-surface p-8">
      <p role="alert" className="text-body-medium text-error">
        {message}
      </p>
      <Link to="/products" className="text-label-large text-primary underline">
        Back to product list
      </Link>
    </section>
  )
}
