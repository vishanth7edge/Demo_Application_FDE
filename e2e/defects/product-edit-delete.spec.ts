// Facilitator-only: these tests describe seeded defects. Do not share with participants.
import { seededDefect } from '../support/defect.ts'
import {
  expect,
  fillProductForm,
  rowFor,
  signInAs,
  test,
  waitForProducts,
} from '../support/fixtures.ts'

test('BUG-025 changing only the status is saved', async ({ page, request }) => {
  seededDefect('BUG-025')
  await signInAs(page, request, '/products/12/edit')
  await fillProductForm(page, { status: 'inactive' })
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('“Yoga Mat Pro 6mm” was updated.')).toBeVisible()
  await page.goto('/products')
  await waitForProducts(page)
  await expect(rowFor(page, 'SP-4001')).toContainText('Inactive')
})

test('BUG-026 editing cannot reuse another product’s SKU in lower case', async ({
  page,
  request,
}) => {
  seededDefect('BUG-026')
  await signInAs(page, request, '/products/12/edit')
  await fillProductForm(page, { sku: 'el-1001' })
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('This SKU is already used by another product')).toBeVisible()
  await expect(page).toHaveURL(/\/products\/12\/edit$/)
})

test('BUG-027 the detail page shows the saved values right after an edit', async ({
  page,
  request,
}) => {
  seededDefect('BUG-027')
  await signInAs(page, request, '/products')
  await waitForProducts(page)
  await page.getByRole('link', { name: 'Edit Yoga Mat Pro 6mm' }).click()
  await fillProductForm(page, { price: '49.99' })
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page).toHaveURL(/\/products\/12$/)
  await expect(page.getByText('$49.99', { exact: true })).toBeVisible()
})

test('BUG-028 the "Products" breadcrumb on the edit page opens the product list', async ({
  page,
  request,
}) => {
  seededDefect('BUG-028')
  await signInAs(page, request, '/products/12/edit')
  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'Products' })
    .click()
  await expect(page).toHaveURL(/\/products$/)
})

test('BUG-029 cancelling one delete and confirming another deletes the right product', async ({
  page,
  request,
}) => {
  seededDefect('BUG-029')
  await signInAs(page, request, '/products')
  await waitForProducts(page)
  const dialog = page.getByRole('dialog', { name: 'Delete product?' })

  await rowFor(page, 'SP-4001').getByRole('button').click()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await rowFor(page, 'AP-5002').getByRole('button').click()
  await expect(dialog).toContainText('Waterproof Rain Jacket')
  await dialog.getByRole('button', { name: 'Delete product' }).click()

  await expect(page.getByText('“Waterproof Rain Jacket” was deleted.')).toBeVisible()
  await expect(rowFor(page, 'AP-5002')).toHaveCount(0)
  await expect(rowFor(page, 'SP-4001')).toHaveCount(1)
})

test('BUG-030 the delete dialog fits a long product name on a phone', async ({ page, request }) => {
  seededDefect('BUG-030')
  await page.setViewportSize({ width: 390, height: 844 })
  await signInAs(page, request, '/products/9')
  await page.getByRole('button', { name: 'Delete' }).click()
  const dialog = page.getByRole('dialog', { name: 'Delete product?' })
  const panel = await dialog.boundingBox()
  const name = await dialog
    .getByText('Ergonomic Mesh Office Chair with Adjustable Lumbar Support')
    .boundingBox()
  expect(panel).not.toBeNull()
  expect(name).not.toBeNull()
  if (panel !== null && name !== null) {
    expect(name.x + name.width).toBeLessThanOrEqual(panel.x + panel.width)
  }
})

test('BUG-031 an unknown product id shows "Product not found"', async ({ page, request }) => {
  seededDefect('BUG-031')
  await signInAs(page, request, '/products/9999')
  await expect(page.getByRole('heading', { name: 'Product not found' })).toBeVisible()
})
