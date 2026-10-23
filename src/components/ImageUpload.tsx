import { useId, useRef, useState } from 'react'

import { blobKey } from '../helpers/blobKey.ts'
import { applyImagePicks } from '../helpers/imagePicks.ts'
import { IMAGE_TYPES, MAX_PRODUCT_IMAGES } from '../helpers/validators.ts'
import { BlobImage } from './BlobImage.tsx'
import { ImageIcon, PlusIcon } from './icons/UiIcons.tsx'
import { ImageThumbnail } from './ImageThumbnail.tsx'
import { ImageActionModal } from './ImageActionModal.tsx'

export interface ImageUploadProps {
  // Newly picked images, kept by the parent form (not uploaded here). The first is the main one.
  files: Blob[]
  onChange: (files: Blob[]) => void
  // Edit mode: the saved image, shown until new images are picked.
  currentImageUrl?: string | undefined
  disabled?: boolean | undefined
}

const TILE = 'aspect-square rounded-lg'
const FOCUS = 'focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none'
const DASHED = 'border-2 border-dashed border-brand/50 bg-sidebar-active'

// Figma "Add Product": a large preview with a row of four slots under it. Filled slots are
// thumbnails (click to show; × asks Remove or Replace); empty slots are dashed "+" tiles that open the picker.
export function ImageUpload({
  files,
  onChange,
  currentImageUrl,
  disabled,
}: ImageUploadProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const errorId = useId()
  // The thumbnail whose × opened the "Attention" modal, and the slot a "Replace" pick goes into.
  const [asking, setAsking] = useState<number | null>(null)
  const replaceRef = useRef<number | null>(null)

  const shownIndex = Math.min(selected, files.length - 1)
  const shown = files[shownIndex]
  const freeSlots = MAX_PRODUCT_IMAGES - files.length

  const openPicker = (): void => {
    inputRef.current?.click()
  }

  const add = (picked: File[]): void => {
    const replaceAt = replaceRef.current
    replaceRef.current = null
    if (picked.length === 0) {
      return
    }
    const result = applyImagePicks(files, picked, replaceAt)
    setError(result.error)
    if (result.show !== null) {
      setSelected(result.show)
      onChange(result.files)
    }
  }

  const dropProps = {
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault()
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault()
      if (!disabled) {
        add(Array.from(event.dataTransfer.files))
      }
    },
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        multiple
        hidden
        data-testid="product-image-input"
        onChange={(event) => {
          add(Array.from(event.target.files ?? []))
          // Allow picking the same file again after removing it.
          event.target.value = ''
        }}
      />

      {shown !== undefined || currentImageUrl !== undefined ? (
        <div className={`flex ${TILE} w-full items-center justify-center overflow-hidden bg-white`}>
          {shown !== undefined ? (
            <BlobImage
              blob={shown}
              alt="Selected product image"
              className="size-full object-contain"
            />
          ) : (
            <img
              src={currentImageUrl}
              alt="Current product image"
              className="size-full object-contain"
            />
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={openPicker}
          {...dropProps}
          aria-describedby={error === null ? undefined : errorId}
          className={`flex ${TILE} w-full flex-col items-center justify-center gap-4 border-2 border-dashed border-on-surface-muted/60 bg-sidebar-active text-body-small hover:bg-sidebar disabled:opacity-60 ${FOCUS}`}
        >
          <ImageIcon className="size-16 text-on-surface-muted" />
          <span>
            <span className="block font-semibold text-brand">Click to Upload Product Picture</span>
            or
            <br />
            drag and drop
          </span>
          <span className="text-on-surface-muted">JPG, PNG or WebP, up to 2 MB each</span>
        </button>
      )}

      <ul className="grid grid-cols-4 gap-3">
        {files.map((file, index) => (
          <ImageThumbnail
            key={blobKey(file)}
            file={file}
            position={index + 1}
            selected={index === shownIndex}
            disabled={disabled}
            onSelect={() => {
              setSelected(index)
            }}
            onRemove={() => {
              setAsking(index)
            }}
          />
        ))}
        {Array.from({ length: freeSlots }, (_, slot) =>
          files.length === 0 && currentImageUrl === undefined ? (
            // Empty form: plain tiles, as in the design; the big area above is the upload button.
            <li
              key={`empty-${String(slot)}`}
              aria-hidden="true"
              className={`${TILE} bg-sidebar-active`}
            />
          ) : (
            <li key={`add-${String(slot)}`} className={TILE}>
              <button
                type="button"
                aria-label="Add image"
                disabled={disabled}
                onClick={openPicker}
                {...dropProps}
                className={`flex size-full items-center justify-center ${TILE} ${DASHED} text-brand hover:bg-sidebar disabled:opacity-60 ${FOCUS}`}
              >
                <PlusIcon className="size-1/2" />
              </button>
            </li>
          ),
        )}
      </ul>

      {asking !== null && (
        <ImageActionModal
          position={asking + 1}
          onClose={() => {
            setAsking(null)
          }}
          onRemove={() => {
            setError(null)
            setAsking(null)
            onChange(files.filter((_, i) => i !== asking))
          }}
          onReplace={() => {
            replaceRef.current = asking
            setAsking(null)
            openPicker()
          }}
        />
      )}

      {error !== null && (
        <p id={errorId} role="alert" className="text-body-small text-error">
          {error}
        </p>
      )}
    </div>
  )
}
