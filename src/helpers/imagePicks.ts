import { MAX_PRODUCT_IMAGES, validateImageFile } from './validators.ts'

export interface ImagePickResult {
  files: Blob[]
  error: string | null
  // The image to show large afterwards (the first new or replaced one), or null if nothing changed.
  show: number | null
}

// Applies files chosen in the picker to the current list: invalid files are skipped with the first
// error shown, extras past MAX_PRODUCT_IMAGES are dropped, and with `replaceAt` the first valid file
// takes that slot instead of being added.
export function applyImagePicks(
  files: Blob[],
  picked: File[],
  replaceAt: number | null,
): ImagePickResult {
  const errors = picked.map((file) => validateImageFile(file))
  const valid = picked.filter((_, i) => errors[i] === undefined)
  const invalid = errors.find((message) => message !== undefined) ?? null

  const [first] = valid
  if (replaceAt !== null) {
    return first === undefined
      ? { files, error: invalid, show: null }
      : {
          files: files.map((file, i) => (i === replaceAt ? first : file)),
          error: null,
          show: replaceAt,
        }
  }

  const accepted = valid.slice(0, MAX_PRODUCT_IMAGES - files.length)
  const tooMany =
    accepted.length < valid.length ? `You can add up to ${String(MAX_PRODUCT_IMAGES)} images` : null
  return accepted.length === 0
    ? { files, error: invalid ?? tooMany, show: null }
    : { files: [...files, ...accepted], error: invalid ?? tooMany, show: files.length }
}
