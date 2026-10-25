/** Shared look for text inputs and selects, with an error variant. */
export function controlClasses(hasError: boolean): string {
  const tone = hasError
    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
    : 'border-slate-300 focus:border-brand focus:ring-brand/20'
  return `block h-10 w-full rounded-lg border bg-surface px-3 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:ring-4 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 ${tone}`
}

/** `aria-describedby` value pointing at the error (or hint) rendered by FormField. */
export function fieldDescribedBy(
  id: string,
  error: string | undefined,
  hasHint = false,
): string | undefined {
  if (error !== undefined) {
    return `${id}-error`
  }
  return hasHint ? `${id}-hint` : undefined
}
