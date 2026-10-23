import { LoadingRegion } from '../LoadingRegion.tsx'
import { Skeleton } from '../Skeleton.tsx'

export type AppShellSkeletonProps = Record<string, never>

// Shown while a saved login is checked: the outline of the sidebar, header and page.
export function AppShellSkeleton(): React.JSX.Element {
  return (
    <LoadingRegion label="Loading…" className="flex h-dvh bg-surface-muted font-poppins">
      <div className="hidden w-72 shrink-0 flex-col gap-8 bg-sidebar p-6 md:flex">
        <Skeleton className="h-12 w-44" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-40" />
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-14.5 items-center justify-between bg-surface px-6 shadow-sm">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="size-11 rounded-lg" />
        </div>
        <div className="flex flex-col gap-4 p-4 md:p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </LoadingRegion>
  )
}
