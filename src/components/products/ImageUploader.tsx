import { useRef, useState } from 'react'

import AlertDialog from '../AlertDialog.tsx'
import Button from '../Button.tsx'
import FileDropzone from '../FileDropzone.tsx'
import { ImageIcon, PlusIcon } from '../Icons.tsx'

export const MAX_PRODUCT_IMAGES = 4

interface UploadedImage {
  /** Object URL of the chosen file. */
  url: string
  name: string
}

function toImages(files: File[]): UploadedImage[] {
  return files
    .filter((file) => file.type.startsWith('image/'))
    .map((file) => ({ url: URL.createObjectURL(file), name: file.name }))
}

export default function ImageUploader(): React.JSX.Element {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [selected, setSelected] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const replaceInput = useRef<HTMLInputElement>(null)

  const current = images[selected]

  const addImages = (files: File[]): void => {
    const added = toImages(files)
    const room = MAX_PRODUCT_IMAGES - images.length
    added.slice(room).forEach((image) => {
      URL.revokeObjectURL(image.url)
    })
    setImages([...images, ...added.slice(0, room)])
  }

  const removeCurrent = (): void => {
    if (current !== undefined) {
      URL.revokeObjectURL(current.url)
    }
    setImages(images.filter((_, index) => index !== selected))
    setSelected(0)
    setConfirming(false)
  }

  const replaceCurrent = (files: File[]): void => {
    const [replacement] = toImages(files)
    if (replacement === undefined || current === undefined) {
      return
    }
    URL.revokeObjectURL(current.url)
    setImages(images.map((image, index) => (index === selected ? replacement : image)))
  }

  return (
    <div className="flex flex-col gap-4">
      {current === undefined ? (
        <FileDropzone
          label="Upload product picture"
          accept="image/*"
          multiple
          onFiles={addImages}
          boxClassName="aspect-square max-h-[28rem] w-full"
        >
          <span className="text-outline">
            <ImageIcon size={120} />
          </span>
          <span className="text-label-large text-primary">Click to Upload Product Picture</span>
          <span className="text-body-medium text-on-surface">or</span>
          <span className="text-body-medium text-on-surface">drag and drop</span>
        </FileDropzone>
      ) : (
        <button
          type="button"
          aria-label={`Change image ${current.name}`}
          onClick={() => {
            setConfirming(true)
          }}
          className="aspect-square max-h-[28rem] w-full overflow-hidden rounded-lg bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <img src={current.url} alt={current.name} className="size-full object-contain" />
        </button>
      )}
      <ul className="grid grid-cols-4 gap-3">
        {Array.from({ length: MAX_PRODUCT_IMAGES }, (_, index) => {
          const image = images[index]
          return (
            <li key={image?.url ?? `slot-${String(index)}`} className="aspect-square">
              {image === undefined ? (
                images.length === 0 ? (
                  <div className="size-full rounded-lg bg-surface-container" />
                ) : (
                  <FileDropzone
                    label="Add another image"
                    accept="image/*"
                    multiple
                    onFiles={addImages}
                    boxClassName="size-full"
                  >
                    <span className="text-primary">
                      <PlusIcon size={40} />
                    </span>
                  </FileDropzone>
                )
              ) : (
                <button
                  type="button"
                  aria-label={`Show image ${image.name}`}
                  aria-pressed={index === selected}
                  onClick={() => {
                    setSelected(index)
                  }}
                  className={`size-full overflow-hidden rounded-lg bg-surface-container-lowest ${
                    index === selected ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <img src={image.url} alt="" className="size-full object-contain" />
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <input
        ref={replaceInput}
        type="file"
        accept="image/*"
        aria-label="Replace image"
        className="sr-only"
        onChange={(event) => {
          replaceCurrent(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      {confirming && (
        <AlertDialog
          tone="warning"
          title="Attention !"
          description="Do you want to replace this image with a new one, or remove it from the product?"
          onClose={() => {
            setConfirming(false)
          }}
          actions={
            <>
              <Button variant="danger" onClick={removeCurrent}>
                Remove
              </Button>
              <Button
                onClick={() => {
                  setConfirming(false)
                  replaceInput.current?.click()
                }}
              >
                Replace
              </Button>
            </>
          }
        />
      )}
    </div>
  )
}
