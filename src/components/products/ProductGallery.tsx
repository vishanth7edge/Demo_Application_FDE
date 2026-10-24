import { useState } from 'react'

import { ChevronLeftIcon, ChevronRightIcon, ImageIcon } from '../Icons.tsx'

export interface ProductGalleryProps {
  title: string
  images: readonly string[]
}

const ARROW_CLASSES =
  'absolute top-1/2 -translate-y-1/2 rounded-md bg-surface p-1 text-primary shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'

export default function ProductGallery({ title, images }: ProductGalleryProps): React.JSX.Element {
  const [index, setIndex] = useState(0)
  const current = images[index]

  if (current === undefined) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-surface-container text-outline">
        <div className="flex flex-col items-center gap-1 text-label-small uppercase">
          <ImageIcon size={48} />
          Product image not available
        </div>
      </div>
    )
  }

  const step = (delta: number): void => {
    setIndex((index + delta + images.length) % images.length)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-container-lowest">
        <img
          src={current}
          alt={`${title} (${String(index + 1)} of ${String(images.length)})`}
          className="size-full object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => {
                step(-1)
              }}
              className={`left-2 ${ARROW_CLASSES}`}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => {
                step(1)
              }}
              className={`right-2 ${ARROW_CLASSES}`}
            >
              <ChevronRightIcon />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-3">
          {images.map((image, position) => (
            <li key={image} className="size-16">
              <button
                type="button"
                aria-label={`Show image ${String(position + 1)}`}
                aria-pressed={position === index}
                onClick={() => {
                  setIndex(position)
                }}
                className={`size-full overflow-hidden rounded-lg bg-surface-container-lowest ${
                  position === index ? 'ring-2 ring-primary' : ''
                }`}
              >
                <img src={image} alt="" className="size-full object-contain" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
