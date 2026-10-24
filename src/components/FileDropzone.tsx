import { useState } from 'react'

export interface FileDropzoneProps {
  /** Accessible name of the file input. */
  label: string
  accept: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  children: React.ReactNode
  /** Extra classes for the box, e.g. its size. */
  boxClassName?: string
}

export default function FileDropzone({
  label,
  accept,
  multiple = false,
  onFiles,
  children,
  boxClassName = 'p-6',
}: FileDropzoneProps): React.JSX.Element {
  const [dragging, setDragging] = useState(false)

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => {
        setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        onFiles(Array.from(event.dataTransfer.files))
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary text-center has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
        dragging ? 'bg-primary-container' : 'bg-primary-95'
      } ${boxClassName}`}
    >
      <input
        type="file"
        aria-label={label}
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      {children}
    </label>
  )
}
