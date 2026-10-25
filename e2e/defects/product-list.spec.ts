// Facilitator-only: these tests describe seeded defects. Do not share with participants.
import type { Page } from '@playwright/test'

import { seededDefect } from '../support/defect.ts'
import {
  columnTexts,
  expect,
  parseMoney,
  productRows,
  rowFor,
  signInAs,
  test,
  waitForProducts,
} from '../support/fixtures.ts'

async function settled(page: Page, url: RegExp): Promise<void> {
  await expect(page).toHaveURL(url)
  await expect(
    page.getByRole('region', { name: 'Product list' }).getByRole('table'),
  ).toHaveAttribute('aria-busy', 'false')
}

test.beforeEach(async ({ page, request }) => {
  await signInAs(page, request, '/products')
  await waitForProducts(page)
})

test('BUG-009 search matches part of a SKU, in any case', async ({ page }) => {
  seededDefect('BUG-009')
  const search = page.getByPlaceholder('Search by product name or SKU')
  await search.fill('1001')
  await settled(page, /search=1001/)
  await expect(productRows(page)).toHaveCount(1)
  await expect(productRows(page).first()).toContainText('EL-1001')
  await search.fill('el-1001')
  await settled(page, /search=el-1001/)
  await expect(productRows(page)).toHaveCount(1)
})

test('BUG-010 price sorts numerically', async ({ page }) => {
  seededDefect('BUG-010')
  await page.getByLabel('Rows per page').selectOption('25')
  await settled(page, /pageSize=25/)
  await page.getByRole('button', { name: 'Price' }).click()
  await settled(page, /sort=price&order=asc/)
  const prices = (await columnTexts(page, 2)).map(parseMoney)
  expect(prices).toEqual([...prices].sort((a, b) => a - b))
})

test('BUG-011 category and status filters combine with AND', async ({ page }) => {
  seededDefect('BUG-011')
  await page.getByLabel('Category').selectOption('Electronics')
  await settled(page, /category=Electronics/)
  await page.getByLabel('Status').selectOption('inactive')
  await settled(page, /status=inactive/)
  await expect(productRows(page)).toHaveCount(1)
  await expect(productRows(page).first()).toContainText('EL-1004')
})

test('BUG-012 sorting by Status works', async ({ page }) => {
  seededDefect('BUG-012')
  await page.getByRole('button', { name: 'Status' }).click()
  await settled(page, /sort=status&order=asc/)
  await expect(page.getByText("We couldn't load products.")).toHaveCount(0)
  await expect(productRows(page).first()).toContainText('Active')
})

test('BUG-013 typing a search term sends one request, not one per key', async ({ page }) => {
  seededDefect('BUG-013')
  const searches: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname === '/api/products' && url.searchParams.has('search')) {
      searches.push(url.searchParams.get('search') ?? '')
    }
  })
  await page
    .getByPlaceholder('Search by product name or SKU')
    .pressSequentially('keyboard', { delay: 60 })
  await settled(page, /search=keyboard/)
  await expect(productRows(page)).toHaveCount(1)
  await page.waitForTimeout(500)
  expect(searches.length, `requests sent: ${searches.join(', ')}`).toBeLessThanOrEqual(2)
})

test('BUG-014 deleting the only product on the last page shows the previous page', async ({
  page,
}) => {
  seededDefect('BUG-014')
  await page.goto('/products?pageSize=5&page=4')
  await waitForProducts(page)
  await expect(productRows(page)).toHaveCount(1)
  await rowFor(page, 'EL-1001').getByRole('button').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete product' }).click()
  await expect(page.getByText('“Wireless Ergonomic Mouse” was deleted.')).toBeVisible()
  await expect(page.getByText('Page 3 of 3')).toBeVisible()
  await expect(productRows(page)).toHaveCount(5)
})

test('BUG-015 row Delete buttons have an accessible name and tooltip', async ({ page }) => {
  seededDefect('BUG-015')
  const button = rowFor(page, 'SP-4001').getByRole('button')
  await expect(button).toHaveAccessibleName('Delete Yoga Mat Pro 6mm')
  await expect(button).toHaveAttribute('title', 'Delete')
})

test('BUG-016 the Discontinued badge uses the danger colour', async ({ page }) => {
  seededDefect('BUG-016')
  const badge = rowFor(page, 'HK-2003').locator('[data-tone]').filter({ hasText: 'Discontinued' })
  await expect(badge).toHaveAttribute('data-tone', 'danger')
})

test('BUG-017 the product table can be scrolled to its Actions column on a tablet', async ({
  page,
}) => {
  seededDefect('BUG-017')
  await page.setViewportSize({ width: 820, height: 1180 })
  await waitForProducts(page)
  const wrapper = page.getByRole('region', { name: 'Product list' }).locator('table').locator('..')
  const metrics = await wrapper.evaluate((element) => ({
    overflowX: getComputedStyle(element).overflowX,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }))
  const fits = metrics.scrollWidth <= metrics.clientWidth
  const scrollable = metrics.overflowX === 'auto' || metrics.overflowX === 'scroll'
  expect(fits || scrollable, JSON.stringify(metrics)).toBe(true)
})
