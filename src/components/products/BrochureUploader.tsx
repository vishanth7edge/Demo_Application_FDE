import { useState } from 'react'

import FileDropzone from '../FileDropzone.tsx'
import { FileIcon, TrashIcon, UploadIcon } from '../Icons.tsx'

export const MAX_BROCHURE_MB = 25
const BYTES_PER_MB = 1024 * 1024

function formatSize(bytes: number): string {
  return bytes < BYTES_PER_MB
    ? `${String(Math.max(1, Math.round(bytes / 1024)))} KB`
    : `${(bytes / BYTES_PER_MB).toFixed(1)} MB`
}

function validateBrochure(file: File): string | null {
  if (file.type !== 'application/pdf') {
    return 'The brochure must be a PDF file'
  }
  return file.size > MAX_BROCHURE_MB * BYTES_PER_MB
    ? `The brochure must be ${String(MAX_BROCHURE_MB)} MB or smaller`
    : null
}

export default function BrochureUploader(): React.JSX.Element {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = (files: File[]): void => {
    const [chosen] = files
    if (chosen === undefined) {
      return
    }
    const problem = validateBrochure(chosen)
    setError(problem)
    if (problem === null) {
      setFile(chosen)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <FileDropzone label="Upload product brochure" accept="application/pdf" onFiles={handleFiles}>
        <span className="rounded-full bg-primary-container p-2 text-on-primary-container">
          <UploadIcon />
        </span>
        <span className="text-body-medium text-on-surface">
          <span className="text-label-large text-primary">Click to Upload</span> or drag and drop
        </span>
        <span className="text-label-small text-on-surface-variant">
          (Max. File size: {MAX_BROCHURE_MB} MB)
        </span>
      </FileDropzone>
      {error !== null && (
        <p role="alert" className="text-body-small text-error">
          {error}
        </p>
      )}
      {file !== null && (
        <div className="flex flex-col gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 text-on-surface">
              <FileIcon />
              <div>
                <p className="text-body-medium">{file.name}</p>
                <p className="text-label-small text-on-surface-variant">{formatSize(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Remove brochure"
              onClick={() => {
                setFile(null)
              }}
              className="rounded-md p-1 text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <TrashIcon />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-secondary" />
            <span className="text-label-small text-on-surface-variant">100%</span>
          </div>
        </div>
      )}
    </div>
  )
}
