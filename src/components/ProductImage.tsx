import { useState } from 'react'

import { BoxIcon } from './icons/ProductIcons.tsx'
import { SHIMMER_CLASSES } from './shimmer.ts'

export interface ProductImageProps {
  src: string
  alt: string
  className?: string | undefined
}

// A product photo, or the design's grey "Product image not available" tile when there is no URL
// or it fails to load. Shimmers until the photo arrives. Give it `key={src}` if the URL can change.
export function ProductImage({ src, alt, className = '' }: ProductImageProps): React.JSX.Element {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (src === '' || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} (image not available)`}
        className={`flex flex-col items-center justify-center gap-2 bg-placeholder text-on-surface-muted/50 ${className}`}
      >
        <BoxIcon className="size-1/3" />
        <span aria-hidden="true" className="text-center text-label-small font-semibold uppercase">
          Product image
          <br />
          not available
        </span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => {
        setLoaded(true)
      }}
      onError={() => {
        setFailed(true)
      }}
      className={`object-contain ${loaded ? 'bg-white' : SHIMMER_CLASSES} ${className}`}
    />
  )
}
