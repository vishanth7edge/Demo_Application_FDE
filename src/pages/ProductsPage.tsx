import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

import emptyProductsUrl from '../assets/empty-products.svg'
import { Button } from '../components/Button.tsx'
import { CategoryFilter } from '../components/CategoryFilter.tsx'
import { EmptyState } from '../components/EmptyState.tsx'
import { buttonClasses } from '../components/fieldStyles.ts'
import { PlusIcon } from '../components/icons/UiIcons.tsx'
import { Modal } from '../components/Modal.tsx'
import { Pagination } from '../components/Pagination.tsx'
import { ProductCard } from '../components/ProductCard.tsx'
import { PRODUCT_GRID_CLASSES, ProductGridSkeleton } from '../components/ProductSkeletons.tsx'
import { SearchInput } from '../components/SearchInput.tsx'
import { AddToCartButton } from '../domains/cart/index.ts'
import { readFlashMessage } from '../helpers/flashMessage.ts'
import { useProductDelete } from '../hooks/useProductDelete.ts'
import { useProductList } from '../hooks/useProductList.ts'
import { PRODUCT_PAGE_SIZE } from '../services/productListService.ts'

export type ProductsPageProps = Record<string, never>

const ADD_PRODUCT = (
  <Link to="/products/new" className={`${buttonClasses('primary')} whitespace-nowrap`}>
    <PlusIcon className="size-5" />
    Add Product
  </Link>
)

export function ProductsPage(): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const list = useProductList()
  const removal = useProductDelete(list.hideProduct)
  // Read once; the history entry is then cleared so the modal does not return on refresh/back.
  const [flash, setFlash] = useState(() => readFlashMessage(location.state))
  const filtered = list.search.trim() !== '' || list.category !== ''

  useEffect(() => {
    if (location.state !== null && readFlashMessage(location.state) !== null) {
      void navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, navigate, location.pathname])

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-4 md:p-6">
      <h1 className="font-poppins text-title-large font-medium">Product List</h1>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <SearchInput
          label="Search products"
          placeholder="Search"
          value={list.search}
          onChange={list.setSearch}
          className="w-full sm:w-48"
        />
        <CategoryFilter applied={list.category} onApply={list.setCategory} />
        {ADD_PRODUCT}
      </div>

      {removal.notice !== null && (
        <p role="status" className="text-body-medium text-brand">
          {removal.notice}
        </p>
      )}

      {list.error !== null ? (
        <p role="alert" className="text-body-medium text-error">
          {list.error}
        </p>
      ) : list.isLoading ? (
        <ProductGridSkeleton />
      ) : list.products.length === 0 && !filtered ? (
        <EmptyState
          title="No products yet"
          description="Upload products to kickstart and streamline your business operations."
          illustration={
            <img src={emptyProductsUrl} alt="" width={388} height={274} className="h-auto w-full" />
          }
          action={
            <Link
              to="/products/new"
              className={`${buttonClasses('primary')} h-12.5 w-full rounded-xl`}
            >
              <PlusIcon className="size-5" />
              Add Product
            </Link>
          }
        />
      ) : list.products.length === 0 ? (
        <p className="py-12 text-center text-body-large text-on-surface-muted">
          No products match your search or filter.
        </p>
      ) : (
        <ul aria-label="Products" className={PRODUCT_GRID_CLASSES}>
          {list.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={() => {
                removal.ask(product)
              }}
              action={<AddToCartButton product={product} />}
            />
          ))}
        </ul>
      )}

      {list.total > 0 && (
        <Pagination
          page={list.page}
          pageSize={PRODUCT_PAGE_SIZE}
          total={list.total}
          onPageChange={list.setPage}
        />
      )}

      {removal.target !== null && (
        <Modal
          tone="warning"
          title="Do you want to delete ?"
          description={
            removal.error ??
            `“${removal.target.title}” will be removed from your products. This cannot be undone.`
          }
          closeLabel="Close"
          onClose={removal.cancel}
        >
          <Button onClick={removal.cancel} disabled={removal.isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={removal.confirm} disabled={removal.isDeleting}>
            {removal.isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </Modal>
      )}

      {flash !== null && (
        <Modal
          tone="success"
          title={flash.title}
          description={flash.message}
          onClose={() => {
            setFlash(null)
          }}
        >
          <Button
            variant="secondary"
            onClick={() => {
              setFlash(null)
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void navigate('/dashboard')
            }}
          >
            Home
          </Button>
        </Modal>
      )}
    </section>
  )
}
