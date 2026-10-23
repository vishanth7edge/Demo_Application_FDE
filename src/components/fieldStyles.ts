// Shared look of text inputs, selects and text areas (kept out of the .tsx files so they only
// export components).
export function fieldControlClasses(hasError: boolean): string {
  return `w-full rounded-lg border bg-surface px-4 py-3 text-body-medium outline-none placeholder:text-on-surface-muted focus-visible:ring-2 disabled:opacity-60 ${
    hasError ? 'border-error focus-visible:ring-error' : 'border-outline focus-visible:ring-brand'
  }`
}

export const BUTTON_VARIANT_CLASSES = {
  primary: 'bg-brand text-brand-foreground hover:opacity-90',
  secondary: 'border border-brand bg-surface text-brand hover:bg-sidebar-active',
  danger: 'border border-error bg-surface text-error hover:bg-error/5',
} as const

export type ButtonVariant = keyof typeof BUTTON_VARIANT_CLASSES

// Also used for links that look like buttons (e.g. "Add Product" on the products page).
export function buttonClasses(variant: ButtonVariant): string {
  return `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-label-large focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60 ${BUTTON_VARIANT_CLASSES[variant]}`
}
