import { useEffect, useState } from 'react'

import type { ApiResult } from '../../shared/apiClient.ts'
import { listProducts, type ProductPage } from '../../services/productService.ts'

const SEARCH_DEBOUNCE_MS = 300

interface Settled {
  key: string
  result: ApiResult<ProductPage>
}

export interface ProductList {
  query: string
  page: number
  /** `null` while a request for the current query and page is in flight. */
  result: ApiResult<ProductPage> | null
  setQuery: (query: string) => void
  setPage: (page: number) => void
  reload: () => void
}

export function useProductList(): ProductList {
  const [searchText, setSearchText] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(0)
  const [reloadCount, setReloadCount] = useState(0)
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchText)
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [searchText])

  const key = `${debouncedQuery}|${String(page)}|${String(reloadCount)}`

  useEffect(() => {
    let ignore = false
    void listProducts({ query: debouncedQuery, page }).then((result) => {
      if (!ignore) {
        setSettled({ key, result })
      }
    })
    return () => {
      ignore = true
    }
  }, [key, debouncedQuery, page])

  return {
    query: searchText,
    page,
    result: settled?.key === key ? settled.result : null,
    setQuery: (next) => {
      setSearchText(next)
      setPage(0)
    },
    setPage,
    reload: () => {
      setReloadCount((count) => count + 1)
    },
  }
}
