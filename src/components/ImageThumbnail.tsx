import { BlobImage } from './BlobImage.tsx'
import { CloseIcon } from './icons/UiIcons.tsx'

export interface ImageThumbnailProps {
  file: Blob
  // 1-based position, used in the button names ("Show image 2").
  position: number
  selected: boolean
  disabled?: boolean | undefined
  onSelect: () => void
  onRemove: () => void
}

const FOCUS = 'focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none'

// One filled slot under the large preview: click to show it, × (on hover, always on touch) to remove or replace it.
export function ImageThumbnail({
  file,
  position,
  selected,
  disabled,
  onSelect,
  onRemove,
}: ImageThumbnailProps): React.JSX.Element {
  return (
    <li className="group relative aspect-square rounded-lg">
      <button
        type="button"
        aria-label={`Show image ${String(position)}`}
        aria-pressed={selected}
        onClick={onSelect}
        className={`size-full overflow-hidden rounded-lg bg-white ${selected ? 'ring-2 ring-brand' : ''} ${FOCUS}`}
      >
        <BlobImage blob={file} alt="" className="size-full object-cover" />
      </button>
      <button
        type="button"
        aria-label={`Remove or replace image ${String(position)}`}
        disabled={disabled}
        onClick={onRemove}
        className={`absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-on-surface text-white opacity-0 shadow group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 ${FOCUS}`}
      >
        <CloseIcon className="size-3.5" />
      </button>
    </li>
  )
}
