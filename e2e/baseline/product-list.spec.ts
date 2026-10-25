import {
  columnTexts,
  expect,
  productRows,
  signInAs,
  test,
  waitForProducts,
} from '../support/fixtures.ts'

test.describe('Product list', () => {
  test.beforeEach(async ({ page, request }) => {
    await signInAs(page, request, '/products')
    await waitForProducts(page)
  })

  test('shows the first page of products, newest first', async ({ page }) => {
    await expect(productRows(page)).toHaveCount(10)
    await expect(page.getByText(/Showing\s*1\s*–\s*10\s*of\s*16 products/)).toBeVisible()
    await expect(productRows(page).first()).toContainText('Vitamin C Brightening Serum 30ml')
  })

  test('pages forwards and back and changes the page size', async ({ page }) => {
    await page.getByRole('button', { name: 'Next page' }).click()
    await expect(productRows(page)).toHaveCount(6)
    await expect(page.getByText('Page 2 of 2')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()
    await page.getByRole('button', { name: 'Previous page' }).click()
    await expect(productRows(page)).toHaveCount(10)
    await page.getByLabel('Rows per page').selectOption('25')
    await expect(productRows(page)).toHaveCount(16)
    await expect(page.getByText('Page 1 of 1')).toBeVisible()
  })

  test('searches product names case-insensitively, ignoring surrounding spaces', async ({
    page,
  }) => {
    await page.getByPlaceholder('Search by product name or SKU').fill('  YOGA  ')
    await expect(productRows(page)).toHaveCount(1)
    await expect(productRows(page).first()).toContainText('Yoga Mat Pro 6mm')
  })

  test('treats special characters in search literally', async ({ page }) => {
    await page.getByPlaceholder('Search by product name or SKU').fill('%')
    await expect(productRows(page)).toHaveCount(1)
    await expect(productRows(page).first()).toContainText('100% Cotton Crew T-Shirt')
  })

  test('shows an empty state when nothing matches, and clears filters', async ({ page }) => {
    await page.getByPlaceholder('Search by product name or SKU').fill('unicorn')
    await expect(page.getByText('No products match your filters')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).first().click()
    await expect(productRows(page)).toHaveCount(10)
    await expect(page.getByPlaceholder('Search by product name or SKU')).toHaveValue('')
  })

  test('filters by category', async ({ page }) => {
    await page.getByLabel('Category').selectOption('Electronics')
    await expect(productRows(page)).toHaveCount(5)
    expect(new Set(await columnTexts(page, 1))).toEqual(new Set(['Electronics']))
  })

  test('filters by status', async ({ page }) => {
    await page.getByLabel('Status').selectOption('discontinued')
    await expect(productRows(page)).toHaveCount(2)
    expect(await columnTexts(page, 4)).toEqual(['Discontinued', 'Discontinued'])
  })

  test('sorts by name', async ({ page }) => {
    await page.getByRole('button', { name: 'Product' }).click()
    await expect(productRows(page).first()).toContainText('100% Cotton Crew T-Shirt')
    await expect(page.getByRole('columnheader', { name: 'Product' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    await page.getByRole('button', { name: 'Product' }).click()
    await expect(productRows(page).first()).toContainText('Yoga Mat Pro 6mm')
  })

  test('keeps filters in the URL across reloads and Back/Forward', async ({ page }) => {
    await page.getByLabel('Category').selectOption('Apparel')
    await expect(page).toHaveURL(/category=Apparel/)
    await expect(productRows(page)).toHaveCount(2)
    await page.reload()
    await expect(page.getByLabel('Category')).toHaveValue('Apparel')
    await expect(productRows(page)).toHaveCount(2)
    await page.goBack()
    await expect(page.getByLabel('Category')).toHaveValue('')
    await expect(productRows(page)).toHaveCount(10)
    await page.goForward()
    await expect(page.getByLabel('Category')).toHaveValue('Apparel')
  })

  test('opens the product detail page from the list', async ({ page }) => {
    await page.getByRole('link', { name: 'Yoga Mat Pro 6mm', exact: true }).click()
    await expect(page).toHaveURL(/\/products\/12$/)
    await expect(page.getByRole('heading', { name: 'Yoga Mat Pro 6mm' })).toBeVisible()
    await expect(page.getByText('$39.99')).toBeVisible()
    await expect(page.getByText('$2,559.36')).toBeVisible()
    await page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Products' })
      .click()
    await expect(page).toHaveURL(/\/products$/)
  })
})
