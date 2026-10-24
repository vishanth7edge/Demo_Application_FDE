import { EMPTY_PRODUCT_FORM, type ProductFormValues } from './productForm.ts'

const DRAFT_KEY = 'product_draft'

// localStorage can throw (private mode, blocked site data), so every access is guarded.
export function saveProductDraft(values: ProductFormValues): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
  } catch {
    // Storage unavailable: the draft is simply not kept.
  }
}

/** Keeps only the known fields whose type matches, so a stale or edited draft cannot break the form. */
export function loadProductDraft(): ProductFormValues {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return EMPTY_PRODUCT_FORM
    }
    const saved = parsed as Record<string, unknown>
    const merged: Record<string, string | boolean> = { ...EMPTY_PRODUCT_FORM }
    for (const [key, fallback] of Object.entries(EMPTY_PRODUCT_FORM)) {
      const value = saved[key]
      if (typeof value === typeof fallback) {
        merged[key] = value as string | boolean
      }
    }
    return merged as unknown as ProductFormValues
  } catch {
    return EMPTY_PRODUCT_FORM
  }
}

export function clearProductDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
