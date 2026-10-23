import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IMAGE_MAX_BYTES } from '../helpers/validators.ts'
import { ImageUpload } from './ImageUpload.tsx'

const createObjectURL = vi.fn<(blob: Blob) => string>()
const revokeObjectURL = vi.fn<(url: string) => void>()

beforeEach(() => {
  let count = 0
  createObjectURL.mockReset().mockImplementation(() => {
    count += 1
    return `blob:preview-${String(count)}`
  })
  revokeObjectURL.mockReset()
  // jsdom has no object URLs.
  Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true })
})

function Harness({ currentImageUrl }: { currentImageUrl?: string }): React.JSX.Element {
  const [files, setFiles] = useState<Blob[]>([])
  return <ImageUpload files={files} onChange={setFiles} currentImageUrl={currentImageUrl} />
}

function png(name = 'photo.png', size = 1024): File {
  const file = new File(['x'], name, { type: 'image/png' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('ImageUpload', () => {
  it('keeps the file input hidden and opens it from the upload button', async () => {
    const user = userEvent.setup()
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined)
    render(<Harness />)

    const input = screen.getByTestId('product-image-input')
    expect(input).not.toBeVisible()
    await user.click(screen.getByRole('button', { name: /Click to Upload Product Picture/ }))

    expect(click).toHaveBeenCalledTimes(1)
  })

  it('previews a valid image with an object URL', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<Harness />)

    await user.upload(screen.getByTestId('product-image-input'), png())

    expect(screen.getByRole('img', { name: 'Selected product image' })).toHaveAttribute(
      'src',
      'blob:preview-1',
    )
  })

  it.each([
    [
      'a GIF',
      new File(['x'], 'anim.gif', { type: 'image/gif' }),
      'Choose a JPG, PNG or WebP image',
    ],
    ['a file over 2 MB', png('big.png', IMAGE_MAX_BYTES + 1), 'Image must be 2 MB or smaller'],
  ])('rejects %s', async (_name, file, message) => {
    const user = userEvent.setup({ applyAccept: false })
    render(<Harness />)

    await user.upload(screen.getByTestId('product-image-input'), file)

    expect(screen.getByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('adds images as thumbnails with "+" tiles for the free slots', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<Harness />)
    const input = screen.getByTestId('product-image-input')

    expect(screen.queryByRole('button', { name: 'Add image' })).not.toBeInTheDocument()
    await user.upload(input, [png('first.png'), png('second.png')])

    expect(screen.getAllByRole('button', { name: /^Show image/ })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Add image' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /Replace/ })).not.toBeInTheDocument()
    // The first of the new picks is shown large.
    expect(screen.getByRole('button', { name: 'Show image 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('switches the large preview when a thumbnail is clicked', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<Harness />)
    const first = png('first.png')
    await user.upload(screen.getByTestId('product-image-input'), [first, png('second.png')])

    await user.click(screen.getByRole('button', { name: 'Show image 1' }))

    expect(screen.getByRole('button', { name: 'Show image 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const main = screen.getByRole('img', { name: 'Selected product image' })
    const firstCall = createObjectURL.mock.calls.findIndex(([blob]) => blob === first)
    expect(main).toHaveAttribute('src', `blob:preview-${String(firstCall + 1)}`)
  })

  it('stops at four images', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<Harness />)

    await user.upload(
      screen.getByTestId('product-image-input'),
      ['a', 'b', 'c', 'd', 'e'].map((name) => png(`${name}.png`)),
    )

    expect(screen.getAllByRole('button', { name: /^Show image/ })).toHaveLength(4)
    expect(screen.queryByRole('button', { name: 'Add image' })).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('You can add up to 4 images')
  })

  it('asks Remove or Replace from the × and removes the image', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const { unmount } = render(<Harness />)

    await user.upload(screen.getByTestId('product-image-input'), png())
    await user.click(screen.getByRole('button', { name: 'Remove or replace image 1' }))
    const modal = screen.getByRole('alertdialog', { name: 'Attention !' })
    await user.click(within(modal).getByRole('button', { name: 'Remove' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Click to Upload Product Picture/ }),
    ).toBeInTheDocument()
    unmount()
    for (const { value } of createObjectURL.mock.results) {
      expect(revokeObjectURL).toHaveBeenCalledWith(value)
    }
  })

  it('replaces an image in the same slot', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined)
    render(<Harness />)
    const input = screen.getByTestId('product-image-input')
    await user.upload(input, [png('first.png'), png('second.png')])

    await user.click(screen.getByRole('button', { name: 'Remove or replace image 1' }))
    await user.click(screen.getByRole('button', { name: 'Replace' }))
    expect(click).toHaveBeenCalledTimes(1)
    const third = png('third.png')
    await user.upload(input, third)

    expect(screen.getAllByRole('button', { name: /^Show image/ })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Show image 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const thirdCall = createObjectURL.mock.calls.findIndex(([blob]) => blob === third)
    expect(screen.getByRole('img', { name: 'Selected product image' })).toHaveAttribute(
      'src',
      `blob:preview-${String(thirdCall + 1)}`,
    )
  })

  it('closes the Attention modal with Escape and keeps the image', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<Harness />)
    await user.upload(screen.getByTestId('product-image-input'), png())

    await user.click(screen.getByRole('button', { name: 'Remove or replace image 1' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show image 1' })).toBeInTheDocument()
  })

  it('shows the current image until a new one is picked', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<Harness currentImageUrl="https://cdn.test/thumb.webp" />)

    expect(screen.getByRole('img', { name: 'Current product image' })).toHaveAttribute(
      'src',
      'https://cdn.test/thumb.webp',
    )
    await user.upload(screen.getByTestId('product-image-input'), png())

    expect(screen.queryByRole('img', { name: 'Current product image' })).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Selected product image' })).toBeInTheDocument()
  })
})
