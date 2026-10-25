import { Link } from 'react-router'

import { hasActiveFilters, PAGE_SIZE_OPTIONS } from '../application/index.ts'
import { useToast } from '../../../shared/feedback/useToast.ts'
import { buttonClasses } from '../../../shared/ui/buttonStyles.ts'
import { Button } from '../../../shared/ui/Button.tsx'
import { EmptyState } from '../../../shared/ui/EmptyState.tsx'
import { IconBox, IconPlus, IconSearch } from '../../../shared/ui/Icons.tsx'
import { PageHeader } from '../../../shared/ui/PageHeader.tsx'
import { Pagination } from '../../../shared/ui/Pagination.tsx'
import { DeleteProductDialog } from './DeleteProductDialog.tsx'
import { ProductFilters } from './ProductFilters.tsx'
import { ProductTable } from './ProductTable.tsx'
import { useProductDelete } from './useProductDelete.ts'
import { useProductList } from './useProductList.ts'

export interface ProductListPageProps {
  /** Admins can add, edit and delete; viewers get a read-only list. */
  canManage: boolean
}

export function ProductListPage({ canManage }: ProductListPageProps): React.JSX.Element {
  const list = useProductList()
  const { notify } = useToast()
  const deletion = useProductDelete((product) => {
    notify(`“${product.name}” was deleted.`)
    list.reload()
  })
  const filtered = hasActiveFilters(list.query)

  const emptyState = filtered ? (
    <EmptyState
      icon={<IconSearch />}
      title="No products match your filters"
      description="Try a different search term or clear the filters to see every product."
      action={
        <Button variant="secondary" onClick={list.clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={<IconBox />}
      title="No products yet"
      description="Products you add will appear here."
      action={
        canManage ? (
          <Link to="/products/new" className={buttonClasses('primary')}>
            <IconPlus className="size-4" /> Add product
          </Link>
        ) : undefined
      }
    />
  )

  return (
    <>
      <PageHeader
        title="Products"
        description="Search, filter and manage every product in the catalogue."
        actions={
          canManage ? (
            <Link to="/products/new" className={buttonClasses('primary')}>
              <IconPlus className="size-4" /> Add product
            </Link>
          ) : undefined
        }
      />

      <section
        aria-label="Product list"
        className="rounded-xl border border-line bg-surface shadow-xs"
      >
        <ProductFilters
          searchText={list.searchText}
          category={list.query.category}
          status={list.query.status}
          showClear={filtered}
          onSearchChange={list.setSearchText}
          onCategoryChange={list.setCategory}
          onStatusChange={list.setStatus}
          onClear={list.clearFilters}
        />
        <ProductTable
          items={list.data?.items ?? null}
          query={list.query}
          loading={list.loading}
          error={list.error}
          canManage={canManage}
          emptyState={emptyState}
          onSort={list.toggleSort}
          onDelete={deletion.requestDelete}
          onRetry={list.reload}
        />
        {list.data === null || list.error !== null ? null : (
          <Pagination
            page={list.query.page}
            pageSize={list.query.pageSize}
            total={list.data.total}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
            itemLabel="products"
          />
        )}
      </section>

      <DeleteProductDialog deletion={deletion} />
    </>
  )
}
