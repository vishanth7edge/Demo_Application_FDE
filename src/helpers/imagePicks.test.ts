import { describe, expect, it } from 'vitest'

import { applyImagePicks } from './imagePicks.ts'
import { IMAGE_MAX_BYTES } from './validators.ts'

function png(name: string, size = 10): File {
  const file = new File(['x'], name, { type: 'image/png' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('applyImagePicks', () => {
  it('adds valid files and shows the first new one', () => {
    const a = png('a.png')
    const b = png('b.png')
    expect(applyImagePicks([a], [b], null)).toEqual({ files: [a, b], error: null, show: 1 })
  })

  it('skips invalid files but keeps the valid ones', () => {
    const ok = png('ok.png')
    const result = applyImagePicks([], [png('big.png', IMAGE_MAX_BYTES + 1), ok], null)
    expect(result.files).toEqual([ok])
    expect(result.error).toBe('Image must be 2 MB or smaller')
  })

  it('stops at four images', () => {
    const current = [png('1.png'), png('2.png'), png('3.png')]
    const result = applyImagePicks(current, [png('4.png'), png('5.png')], null)
    expect(result.files).toHaveLength(4)
    expect(result.error).toBe('You can add up to 4 images')
  })

  it('replaces the given slot with the first valid file', () => {
    const [a, b, c] = [png('a.png'), png('b.png'), png('c.png')]
    expect(applyImagePicks([a, b], [c, png('d.png')], 0)).toEqual({
      files: [c, b],
      error: null,
      show: 0,
    })
  })

  it('leaves the list alone when a replacement is invalid', () => {
    const a = png('a.png')
    const gif = new File(['x'], 'x.gif', { type: 'image/gif' })
    expect(applyImagePicks([a], [gif], 0)).toEqual({
      files: [a],
      error: 'Choose a JPG, PNG or WebP image',
      show: null,
    })
  })
})
