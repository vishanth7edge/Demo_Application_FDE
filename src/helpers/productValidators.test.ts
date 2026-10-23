import { describe, expect, it } from 'vitest'

import {
  EMPTY_PRODUCT_VALUES,
  IMAGE_MAX_BYTES,
  validateImageFile,
  validatePercentage,
  validatePrice,
  validateProductForm,
  validateProductSize,
} from './validators.ts'

describe('validateImageFile', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('accepts %s', (type) => {
    expect(validateImageFile({ type, size: 1024 })).toBeUndefined()
  })

  it.each(['image/gif', 'image/svg+xml', 'application/pdf', ''])('rejects %s', (type) => {
    expect(validateImageFile({ type, size: 1024 })).toBe('Choose a JPG, PNG or WebP image')
  })

  it('accepts exactly 2 MB and rejects anything larger', () => {
    expect(validateImageFile({ type: 'image/png', size: IMAGE_MAX_BYTES })).toBeUndefined()
    expect(validateImageFile({ type: 'image/png', size: IMAGE_MAX_BYTES + 1 })).toBe(
      'Image must be 2 MB or smaller',
    )
  })

  it('reports the type before the size', () => {
    expect(validateImageFile({ type: 'image/gif', size: IMAGE_MAX_BYTES * 2 })).toBe(
      'Choose a JPG, PNG or WebP image',
    )
  })
})

describe('validatePrice', () => {
  it('requires a value only when asked to', () => {
    expect(validatePrice('', 'Rate', true)).toBe('Rate is required')
    expect(validatePrice('  ', 'Rate', false)).toBeUndefined()
  })

  it.each(['0', '-5', 'abc', '1.234', '1,5'])('rejects %s', (value) => {
    expect(validatePrice(value, 'Rate', true)).toBe(
      'Rate must be a positive amount with up to 2 decimals',
    )
  })

  it.each(['1', '200', '19.9', '19.99'])('accepts %s', (value) => {
    expect(validatePrice(value, 'Rate', true)).toBeUndefined()
  })
})

describe('validatePercentage', () => {
  it('allows empty or 0-100 only', () => {
    expect(validatePercentage('', 'Margin')).toBeUndefined()
    expect(validatePercentage('12.5', 'Margin')).toBeUndefined()
    expect(validatePercentage('101', 'Margin')).toBe('Margin must be a number between 0 and 100')
    expect(validatePercentage('x', 'Margin')).toBe('Margin must be a number between 0 and 100')
  })
})

describe('validateProductSize', () => {
  it.each(['', '10*20*5', '10.5 x 20 x 5', '1×2×3'])('accepts "%s"', (value) => {
    expect(validateProductSize(value)).toBeUndefined()
  })

  it.each(['10*20', 'big', '10*20*'])('rejects "%s"', (value) => {
    expect(validateProductSize(value)).toBe(
      'Product size must look like L*W*H, for example 10*20*5',
    )
  })
})

describe('validateProductForm', () => {
  it('requires name, category and rate per unit', () => {
    expect(validateProductForm(EMPTY_PRODUCT_VALUES)).toEqual({
      name: 'Product name is required',
      category: 'Choose a product category',
      ratePerUnit: 'Rate per unit is required',
    })
  })

  it('passes a minimal valid product', () => {
    expect(
      validateProductForm({
        ...EMPTY_PRODUCT_VALUES,
        name: 'RCC Cement',
        category: 'construction',
        ratePerUnit: '200',
      }),
    ).toEqual({})
  })
})
