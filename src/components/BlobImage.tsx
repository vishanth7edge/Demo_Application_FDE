import { useEffect, useRef } from 'react'

export interface BlobImageProps {
  blob: Blob
  alt: string
  className?: string | undefined
}

// Shows a local file (not yet uploaded). The object URL is created inside the effect, not during
// render, so StrictMode's extra cleanup/re-run makes a fresh URL instead of showing a revoked one;
// the cleanup revokes it when the blob changes or the image unmounts.
export function BlobImage({ blob, alt, className }: BlobImageProps): React.JSX.Element {
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const image = ref.current
    if (image === null) {
      return
    }
    const url = URL.createObjectURL(blob)
    image.src = url
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [blob])

  return <img ref={ref} alt={alt} className={className} />
}
