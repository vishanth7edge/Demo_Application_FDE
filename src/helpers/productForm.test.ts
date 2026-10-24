import { describe, expect, it } from 'vitest'

import { clearProductDraft, loadProductDraft, saveProductDraft } from './productDraftStorage.ts'
import { calculateMargin, EMPTY_PRODUCT_FORM, validateProductForm } from './productForm.ts'
import { hasErrors } from './validators.ts'

describe('validateProductForm', () => {
  it('requires the core fields', () => {
    const errors = validateProductForm(EMPTY_PRODUCT_FORM)
    expect(errors.name).toBe('Product name is required')
    expect(errors.uom).toBe('UOM is required')
    expect(errors.ratePerUnit).toBe('Rate per unit is required')
  })

  it('rejects non-positive and non-numeric prices', () => {
    const base = { ...EMPTY_PRODUCT_FORM, ratePerUnit: '-3', marketPrice: 'abc' }
    const errors = validateProductForm(base)
    expect(errors.ratePerUnit).toBe('Rate per unit must be a positive number')
    expect(errors.marketPrice).toBe('Market selling price must be a positive number')
  })

  it('accepts a complete form', () => {
    const errors = validateProductForm({
      ...EMPTY_PRODUCT_FORM,
      name: 'RCC Cement',
      category: 'Construction',
      description: 'Grey powder',
      form: 'Powder',
      safety: 'Flammable',
      uom: 'Per Unit',
      ratePerUnit: '200',
      marketPrice: '300',
    })
    expect(hasErrors(errors)).toBe(false)
  })
})

describe('calculateMargin', () => {
  it('is the profit as a percentage of the rate', () => {
    expect(calculateMargin('200', '300')).toBe('50%')
    expect(calculateMargin('300', '200')).toBe('-33%')
  })

  it('is empty until both prices are valid', () => {
    expect(calculateMargin('', '300')).toBe('')
    expect(calculateMargin('0', '300')).toBe('')
    expect(calculateMargin('x', '300')).toBe('')
  })
})

describe('product draft storage', () => {
  it('round-trips a draft and ignores bad fields', () => {
    saveProductDraft({ ...EMPTY_PRODUCT_FORM, name: 'Cement', ecoFriendly: true })
    expect(loadProductDraft().name).toBe('Cement')
    expect(loadProductDraft().ecoFriendly).toBe(true)

    localStorage.setItem('product_draft', JSON.stringify({ name: 5, ecoFriendly: 'yes' }))
    expect(loadProductDraft()).toEqual(EMPTY_PRODUCT_FORM)

    clearProductDraft()
    localStorage.setItem('product_draft', '{not json')
    expect(loadProductDraft()).toEqual(EMPTY_PRODUCT_FORM)
  })
})
