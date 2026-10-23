import { describe, expect, it } from 'vitest'

import { getRouteBreadcrumb, getRouteTitle } from './routeTitle.ts'

describe('getRouteTitle', () => {
  it('returns the deepest title', () => {
    expect(
      getRouteTitle([
        { handle: { title: 'Outer' } },
        { handle: undefined },
        { handle: { title: 'Inner' } },
      ]),
    ).toBe('Inner')
  })

  it('skips handles without a string title', () => {
    expect(getRouteTitle([{ handle: { title: 'Outer' } }, { handle: { title: 3 } }])).toBe('Outer')
  })

  it('returns undefined when no route has a title', () => {
    expect(getRouteTitle([{ handle: null }, { handle: 'x' }])).toBeUndefined()
  })
})

describe('getRouteBreadcrumb', () => {
  it('returns the parent links and the title', () => {
    expect(
      getRouteBreadcrumb([
        {
          handle: {
            title: 'Product Detail',
            parents: [{ label: 'Product List', to: '/products' }, { label: 3 }],
          },
        },
      ]),
    ).toEqual({ parents: [{ label: 'Product List', to: '/products' }], title: 'Product Detail' })
  })

  it('has no parents when the route lists none', () => {
    expect(getRouteBreadcrumb([{ handle: { title: 'Cart' } }])).toEqual({
      parents: [],
      title: 'Cart',
    })
  })
})
