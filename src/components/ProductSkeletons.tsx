import { LoadingRegion } from './LoadingRegion.tsx'
import { Skeleton } from './Skeleton.tsx'

// Placeholders shaped like the product screens, shown instead of "Loading…" text.

export type ProductGridSkeletonProps = Record<string, never>

export const PRODUCT_GRID_CLASSES =
  'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

export function ProductGridSkeleton(): React.JSX.Element {
  return (
    <LoadingRegion label="Loading products…" className={PRODUCT_GRID_CLASSES}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-lg bg-surface shadow-sm">
          <Skeleton className="aspect-[118/117] w-full rounded-none" />
          <div className="flex flex-col gap-2 p-2 pb-3">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </div>
        </div>
      ))}
    </LoadingRegion>
  )
}

export type ProductDetailSkeletonProps = Record<string, never>

export function ProductDetailSkeleton(): React.JSX.Element {
  return (
    <LoadingRegion label="Loading product…" className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="flex gap-3">
            <Skeleton className="size-16 sm:size-20" />
            <Skeleton className="size-16 sm:size-20" />
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </div>
      </div>
    </LoadingRegion>
  )
}

export type ProductFormSkeletonProps = Record<string, never>

export function ProductFormSkeleton(): React.JSX.Element {
  return (
    <LoadingRegion label="Loading product…" className="grid gap-6 lg:grid-cols-[2fr_3fr]">
      <div className="flex flex-col gap-4 rounded-xl bg-surface p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-5 rounded-xl bg-surface p-6">
        <Skeleton className="h-5 w-48" />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}
