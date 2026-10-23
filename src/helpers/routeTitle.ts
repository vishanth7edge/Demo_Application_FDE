// Page titles live on routes as `handle: { title, parents? }` (see routes.ts). The deepest match
// wins. `parents` are the earlier breadcrumb steps, shown as links before the title:
// "Product List / Product Detail" where "Product List" goes back to /products.

export interface BreadcrumbLink {
  label: string
  to: string
}

export interface RouteBreadcrumb {
  parents: BreadcrumbLink[]
  title: string
}

function isBreadcrumbLink(value: unknown): value is BreadcrumbLink {
  return (
    typeof value === 'object' &&
    value !== null &&
    'label' in value &&
    'to' in value &&
    typeof value.label === 'string' &&
    typeof value.to === 'string'
  )
}

export function getRouteBreadcrumb(
  matches: readonly { handle: unknown }[],
): RouteBreadcrumb | undefined {
  for (const { handle } of [...matches].reverse()) {
    if (typeof handle === 'object' && handle !== null && 'title' in handle) {
      if (typeof handle.title === 'string') {
        const parents =
          'parents' in handle && Array.isArray(handle.parents)
            ? handle.parents.filter(isBreadcrumbLink)
            : []
        return { parents, title: handle.title }
      }
    }
  }
  return undefined
}

export function getRouteTitle(matches: readonly { handle: unknown }[]): string | undefined {
  return getRouteBreadcrumb(matches)?.title
}
