import { useState } from 'react'

import { ChevronLeftIcon, ChevronNextIcon } from './icons/ProductIcons.tsx'
import { ProductImage } from './ProductImage.tsx'

export interface ImageCarouselProps {
  images: string[]
  // Used for the alt text: "RCC Cement, image 1 of 3".
  title: string
}

const ARROW =
  'absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg bg-sidebar-active text-brand shadow hover:bg-sidebar focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none'

// Figma "Product Detail": large image with ‹ › arrows and a row of thumbnails under it.
export function ImageCarousel({ images, title }: ImageCarouselProps): React.JSX.Element {
  const [index, setIndex] = useState(0)
  const count = images.length
  const current = images[Math.min(index, count - 1)] ?? ''
  const step = (delta: number): void => {
    setIndex((value) => (value + delta + count) % count)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl bg-white">
        <ProductImage
          key={current}
          src={current}
          alt={count > 1 ? `${title}, image ${String(index + 1)} of ${String(count)}` : title}
          className="aspect-[4/3] w-full"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => {
                step(-1)
              }}
              className={`${ARROW} left-3`}
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => {
                step(1)
              }}
              className={`${ARROW} right-3`}
            >
              <ChevronNextIcon className="size-5" />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <ul className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                aria-label={`Show image ${String(i + 1)}`}
                aria-pressed={i === index}
                onClick={() => {
                  setIndex(i)
                }}
                className={`size-16 overflow-hidden rounded-lg bg-white shadow-sm sm:size-20 ${i === index ? 'ring-2 ring-brand' : ''} focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none`}
              >
                <ProductImage key={src} src={src} alt="" className="size-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
