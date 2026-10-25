import type { Locator, Page } from '@playwright/test'

import { createProductViaApi, expect, signInAs, test } from '../support/fixtures.ts'

function card(page: Page, label: string): Locator {
  return page
    .getByRole('region', { name: 'Catalogue summary' })
    .locator('div.rounded-xl')
    .filter({ hasText: label })
}

test.describe('Dashboard', () => {
  test('summarises the catalogue', async ({ page, request }) => {
    await signInAs(page, request, '/dashboard')
    await expect(card(page, 'Total products')).toContainText('16')
    await expect(card(page, 'Active products')).toContainText('12')
    await expect(card(page, 'Active products')).toContainText('75% of the catalogue is active')
  })

  test('lists the five newest products, newest first', async ({ page, request }) => {
    await signInAs(page, request, '/dashboard')
    const rows = page.getByRole('table').locator('tbody tr')
    await expect(rows).toHaveCount(5)
    await expect(rows.first()).toContainText('BH-6001')
    await expect(rows.last()).toContainText('SP-4001')
  })

  test('reflects newly added products', async ({ page, request }) => {
    await createProductViaApi(request, { name: 'Linen Apron', sku: 'HK-2999' })
    await signInAs(page, request, '/dashboard')
    await expect(card(page, 'Total products')).toContainText('17')
    await expect(page.getByRole('table').locator('tbody tr').first()).toContainText('Linen Apron')
  })

  test('sidebar navigation moves between Dashboard and Products', async ({ page, request }) => {
    await signInAs(page, request, '/dashboard')
    const nav = page.getByRole('navigation', { name: 'Main' })
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await nav.getByRole('link', { name: 'Products' }).click()
    await expect(page).toHaveURL(/\/products$/)
    await expect(nav.getByRole('link', { name: 'Products' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await nav.getByRole('link', { name: 'Dashboard' }).click()
    await page.getByRole('link', { name: 'View all products →' }).click()
    await expect(page).toHaveURL(/\/products$/)
  })

  test('unknown pages show a not-found page', async ({ page, request }) => {
    await signInAs(page, request, '/settings/billing')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await page.getByRole('link', { name: 'Go to the dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
