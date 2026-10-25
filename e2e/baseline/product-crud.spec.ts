import {
  expect,
  fillProductForm,
  productRows,
  rowFor,
  signInAs,
  test,
  VALID_PRODUCT,
  waitForProducts,
} from '../support/fixtures.ts'

test.describe('Add product', () => {
  test('creates a product that appears first and persists after reload', async ({
    page,
    request,
  }) => {
    await signInAs(page, request, '/products')
    await page.getByRole('link', { name: 'Add product' }).click()
    await expect(page).toHaveURL(/\/products\/new$/)
    await fillProductForm(page, VALID_PRODUCT)
    await page.getByRole('button', { name: 'Create product' }).click()

    await expect(page).toHaveURL(/\/products$/)
    await expect(page.getByText(`“${VALID_PRODUCT.name}” was created.`)).toBeVisible()
    await waitForProducts(page)
    await expect(productRows(page).first()).toContainText(VALID_PRODUCT.name)
    await expect(productRows(page).first()).toContainText('$27.40')
    await expect(page.getByText(/of\s*17 products/)).toBeVisible()

    await page.reload()
    await waitForProducts(page)
    await expect(productRows(page).first()).toContainText('OF-3999')
  })

  test('shows every required-field error', async ({ page, request }) => {
    await signInAs(page, request, '/products/new')
    await page.getByRole('button', { name: 'Create product' }).click()
    for (const message of [
      'Product name is required',
      'SKU is required',
      'Select a category',
      'Price is required',
      'Quantity is required',
    ]) {
      await expect(page.locator('p').filter({ hasText: message })).toBeVisible()
    }
    await expect(page).toHaveURL(/\/products\/new$/)
  })

  test('rejects invalid values', async ({ page, request }) => {
    await signInAs(page, request, '/products/new')
    await fillProductForm(page, {
      ...VALID_PRODUCT,
      name: 'ab',
      sku: 'BAD SKU!',
      price: '12.345',
      quantity: '-1',
    })
    await page.getByRole('button', { name: 'Create product' }).click()
    await expect(page.getByText('Product name must be at least 3 characters')).toBeVisible()
    await expect(page.getByText(/SKU must be 4–20 characters/)).toBeVisible()
    await expect(page.getByText('Price can have at most 2 decimal places')).toBeVisible()
    await expect(page.getByText('Quantity must be between 0 and 10,000')).toBeVisible()

    await fillProductForm(page, { price: '100000', quantity: '10001', name: 'a'.repeat(120) })
    await page.getByRole('button', { name: 'Create product' }).click()
    await expect(page.getByText('Price must be between $0.01 and $99,999.99')).toBeVisible()
    await expect(page.getByText('Quantity must be between 0 and 10,000')).toBeVisible()
    await expect(page.getByLabel(/^Product name/)).toHaveValue('a'.repeat(100))
  })

  test('rejects a duplicate SKU regardless of case', async ({ page, request }) => {
    await signInAs(page, request, '/products/new')
    await fillProductForm(page, { ...VALID_PRODUCT, sku: 'el-1001' })
    await page.getByRole('button', { name: 'Create product' }).click()
    await expect(page.getByText('This SKU is already used by another product')).toBeVisible()
    await expect(page).toHaveURL(/\/products\/new$/)
  })

  test('cancel returns to the list without saving', async ({ page, request }) => {
    await signInAs(page, request, '/products/new')
    await fillProductForm(page, VALID_PRODUCT)
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page).toHaveURL(/\/products$/)
    await expect(page.getByText(/of\s*16 products/)).toBeVisible()
  })
})

test.describe('Edit product', () => {
  test('updates name, price and quantity of the right product', async ({ page, request }) => {
    await signInAs(page, request, '/products')
    await waitForProducts(page)
    await page.getByRole('link', { name: 'Edit Yoga Mat Pro 6mm' }).click()
    await expect(page.getByLabel(/^Product name/)).toHaveValue('Yoga Mat Pro 6mm')
    await fillProductForm(page, { name: 'Yoga Mat Pro 8mm', price: '44.50', quantity: '70' })
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('“Yoga Mat Pro 8mm” was updated.')).toBeVisible()

    await page.goto('/products')
    await waitForProducts(page)
    const row = rowFor(page, 'SP-4001')
    await expect(row).toContainText('Yoga Mat Pro 8mm')
    await expect(row).toContainText('$44.50')
    await expect(row).toContainText('70')
    await expect(rowFor(page, 'SP-4002')).toContainText('Trail Running Backpack 20L')
  })
})

test.describe('Delete product', () => {
  test('deletes the confirmed product and updates the count', async ({ page, request }) => {
    await signInAs(page, request, '/products')
    await waitForProducts(page)
    await rowFor(page, 'AP-5002').getByRole('button').click()
    const dialog = page.getByRole('dialog', { name: 'Delete product?' })
    await expect(dialog).toContainText('Waterproof Rain Jacket')
    await dialog.getByRole('button', { name: 'Delete product' }).click()
    await expect(page.getByText('“Waterproof Rain Jacket” was deleted.')).toBeVisible()
    await expect(rowFor(page, 'AP-5002')).toHaveCount(0)
    await expect(page.getByText(/of\s*15 products/)).toBeVisible()
  })

  test('the dialog can be dismissed with Cancel or Escape', async ({ page, request }) => {
    await signInAs(page, request, '/products')
    await waitForProducts(page)
    const trigger = rowFor(page, 'SP-4001').getByRole('button')
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Delete product?' })
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    await expect(rowFor(page, 'SP-4001')).toHaveCount(1)
  })

  test('deleting from the detail page returns to the list', async ({ page, request }) => {
    await signInAs(page, request, '/products/15')
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete product' }).click()
    await expect(page).toHaveURL(/\/products$/)
    await expect(page.getByText('“Waterproof Rain Jacket” was deleted.')).toBeVisible()
  })
})
