import { useEffect, useState } from 'react'

import { listProducts } from '../services/productListService.ts'

import type { Product } from '../services/productService.ts'
import type { ProductListInput } from '../services/productListService.ts'

const SEARCH_DELAY_MS = 300

type Loaded =
  { error: false; products: Product[]; total: number } | { error: true; message: string }

export interface ProductList {
  search: string
  setSearch: (value: string) => void
  category: string
  setCategory: (value: string) => void
  page: number
  setPage: (value: number) => void
  isLoading: boolean
  error: string | null
  products: Product[]
  total: number
  // DummyJSON does not really delete, so a deleted product is hidden here instead.
  hideProduct: (id: number) => void
}

function requestKey(input: ProductListInput): string {
  return JSON.stringify(input)
}

// Search (debounced), category filter and paging for the products page.
export function useProductList(): ProductList {
  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [hidden, setHidden] = useState<number[]>([])
  // Which request the data belongs to; "loading" is derived from it rather than set in the effect.
  const [loaded, setLoaded] = useState<{ key: string; data: Loaded } | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchText)
    }, SEARCH_DELAY_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [searchText])

  const key = requestKey({ search: query, category: categoryFilter, page })

  useEffect(() => {
    let cancelled = false
    const request: ProductListInput = { search: query, category: categoryFilter, page }
    void listProducts(request).then((result) => {
      if (!cancelled) {
        setLoaded({
          key: requestKey(request),
          data: result.error
            ? { error: true, message: result.message }
            : { error: false, ...result.data },
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [query, categoryFilter, page])

  const data = loaded?.data
  const ok = data !== undefined && !data.error ? data : null
  const visible = ok?.products.filter((product) => !hidden.includes(product.id)) ?? []
  const hiddenHere = (ok?.products.length ?? 0) - visible.length

  return {
    search: searchText,
    setSearch: (value) => {
      setSearchText(value)
      setPage(1)
    },
    category: categoryFilter,
    setCategory: (value) => {
      setCategoryFilter(value)
      setPage(1)
    },
    page,
    setPage,
    isLoading: loaded?.key !== key,
    error: data?.error === true ? data.message : null,
    products: visible,
    total: Math.max(0, (ok?.total ?? 0) - hiddenHere),
    hideProduct: (id) => {
      setHidden((ids) => [...ids, id])
    },
  }
}
