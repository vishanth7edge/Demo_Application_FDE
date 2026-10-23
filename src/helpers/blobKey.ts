const keys = new WeakMap<Blob, string>()
let nextKey = 0

// Stable React key for a picked file, so removing one image does not reuse another's preview.
export function blobKey(blob: Blob): string {
  let key = keys.get(blob)
  if (key === undefined) {
    nextKey += 1
    key = `image-${String(nextKey)}`
    keys.set(blob, key)
  }
  return key
}
