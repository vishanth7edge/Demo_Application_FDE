import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { fetchProducts, getNextSort, parseListParams, toListParams } from '../application/index.ts'
import type { ProductListQuery, ProductListResult, ProductSortField } from '../application/index.ts'
import type { ApiResult } from '../../../shared/api/apiClient.ts'

export interface ProductList {
  query: ProductListQuery
  searchText: string
  /** Last successfully loaded page (kept visible, dimmed, while the next one loads). */
  data: ProductListResult | null
  loading: boolean
  error: string | null
  setSearchText: (value: string) => void
  setCategory: (value: string) => void
  setStatus: (value: string) => void
  toggleSort: (field: ProductSortField) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  clearFilters: () => void
  reload: () => void
}

interface Response {
  key: string
  result: ApiResult<ProductListResult>
}

export function useProductList(): ProductList {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => parseListParams(params), [params])
  const [searchText, setSearchText] = useState(query.search)
  const [syncedSearch, setSyncedSearch] = useState(query.search)
  const [reloadCount, setReloadCount] = useState(0)
  const [response, setResponse] = useState<Response | null>(null)
  const [lastData, setLastData] = useState<ProductListResult | null>(null)

  // The URL changed from outside the search box (Back/Forward, "Clear filters"): follow it.
  if (syncedSearch !== query.search) {
    setSyncedSearch(query.search)
    setSearchText(query.search)
  }

  const updateQuery = useCallback(
    (changes: Partial<ProductListQuery>, replace = false): void => {
      setParams((current) => toListParams({ ...parseListParams(current), ...changes }), { replace })
    },
    [setParams],
  )

  const requestKey = `${toListParams(query).toString()}#${String(reloadCount)}`

  useEffect(() => {
    let ignore = false
    void fetchProducts(query).then((result) => {
      if (ignore) {
        return
      }
      setResponse({ key: requestKey, result })
      if (result.error) {
        console.error('[products] Failed to load products:', result)
      } else {
        setLastData(result.data)
      }
    })
    return () => {
      ignore = true
    }
  }, [query, requestKey])

  // Keep the URL (and so the results) in step with the search box.
  useEffect(() => {
    if (searchText !== query.search) {
      updateQuery({ search: searchText, page: 1 }, true)
    }
  }, [searchText, query.search, updateQuery])

  const current = response?.key === requestKey ? response.result : null
  const data = current !== null && !current.error ? current.data : lastData

  return {
    query,
    searchText,
    data,
    loading: current === null,
    error: current?.error === true ? current.message : null,
    setSearchText,
    setCategory: (category) => {
      updateQuery({ category: category as ProductListQuery['category'], page: 1 })
    },
    setStatus: (status) => {
      updateQuery({ status: status as ProductListQuery['status'], page: 1 })
    },
    toggleSort: (field) => {
      updateQuery({ ...getNextSort(query, field), page: 1 })
    },
    setPage: (page) => {
      updateQuery({ page })
    },
    setPageSize: (pageSize) => {
      updateQuery({ pageSize, page: 1 })
    },
    clearFilters: () => {
      setSearchText('')
      updateQuery({ search: '', category: '', status: '', page: 1 })
    },
    reload: () => {
      setReloadCount((count) => count + 1)
    },
  }
}
