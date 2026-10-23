import { SHIMMER_CLASSES } from './shimmer.ts'

export interface SkeletonProps {
  // Size and shape, e.g. "h-4 w-1/2" or "aspect-square w-full".
  className?: string | undefined
}

// One shimmering placeholder block. Hidden from screen readers: wrap a group of them in
// <LoadingRegion> so the loading state is announced once.
export function Skeleton({ className = '' }: SkeletonProps): React.JSX.Element {
  return <div aria-hidden="true" className={`rounded-md ${SHIMMER_CLASSES} ${className}`} />
}
