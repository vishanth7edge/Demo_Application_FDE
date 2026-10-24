import { useState } from 'react'
import { useNavigate } from 'react-router'

import AlertDialog from '../components/AlertDialog.tsx'
import Button from '../components/Button.tsx'
import EmptyState from '../components/EmptyState.tsx'
import { PlusIcon } from '../components/Icons.tsx'
import Pagination from '../components/Pagination.tsx'
import ProductCard from '../components/products/ProductCard.tsx'
import { useProductList } from '../components/products/useProductList.ts'
import SearchInput from '../components/SearchInput.tsx'
import { deleteProduct, PRODUCTS_PAGE_SIZE, type Product } from '../services/productService.ts'

export default function ProductsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { query, page, result, setQuery, setPage, reload } = useProductList()
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const confirmDelete = async (product: Product): Promise<void> => {
    const outcome = await deleteProduct(product.id)
    setPendingDelete(null)
    if (outcome.error) {
      setDeleteError(outcome.message)
      return
    }
    setDeleteError(null)
    reload()
  }

  const renderBody = (): React.JSX.Element => {
    if (result === null) {
      return (
        <p role="status" className="py-16 text-center text-body-medium text-on-surface-variant">
          Loading products…
        </p>
      )
    }
    if (result.error) {
      return (
        <p role="alert" className="py-16 text-center text-body-medium text-error">
          {result.message}
        </p>
      )
    }
    if (result.data.products.length === 0) {
      return (
        <EmptyState
          title="No products yet"
          description={
            query.trim() === ''
              ? 'Upload products to kickstart and streamline your business operations.'
              : 'No products match your search.'
          }
        />
      )
    }
    return (
      <>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {result.data.products.map((product) => (
            <ProductCard key={product.id} product={product} onDelete={setPendingDelete} />
          ))}
        </ul>
        <Pagination
          page={page}
          pageSize={PRODUCTS_PAGE_SIZE}
          total={result.data.total}
          onPageChange={setPage}
        />
      </>
    )
  }

  return (
    <section className="flex flex-col gap-6 rounded-xl bg-surface p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-headline-small text-on-surface">Product List</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput label="Search products" value={query} onChange={setQuery} />
          <Button
            onClick={() => {
              void navigate('/products/new')
            }}
          >
            <PlusIcon size={18} />
            Add Product
          </Button>
        </div>
      </div>
      {deleteError !== null && (
        <p role="alert" className="rounded-md bg-error-container p-3 text-on-error-container">
          {deleteError}
        </p>
      )}
      {renderBody()}
      {pendingDelete !== null && (
        <AlertDialog
          tone="warning"
          title="Do you want to delete ?"
          description={`“${pendingDelete.title}” will be removed from your product list.`}
          onClose={() => {
            setPendingDelete(null)
          }}
          actions={
            <>
              <Button
                onClick={() => {
                  setPendingDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  void confirmDelete(pendingDelete)
                }}
              >
                Delete
              </Button>
            </>
          }
        />
      )}
    </section>
  )
}
