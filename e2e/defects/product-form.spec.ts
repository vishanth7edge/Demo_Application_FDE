// Facilitator-only: these tests describe seeded defects. Do not share with participants.
import { seededDefect } from '../support/defect.ts'
import {
  expect,
  fillProductForm,
  productRows,
  signInAs,
  test,
  VALID_PRODUCT,
  waitForProducts,
} from '../support/fixtures.ts'

test.beforeEach(async ({ page, request }) => {
  await signInAs(page, request, '/products/new')
  await expect(page.getByRole('heading', { name: 'Add product' })).toBeVisible()
})

test('BUG-018 a price of $0.00 is rejected', async ({ page }) => {
  seededDefect('BUG-018')
  await fillProductForm(page, { ...VALID_PRODUCT, price: '0' })
  await page.getByRole('button', { name: 'Create product' }).click()
  await expect(page.getByText('Price must be between $0.01 and $99,999.99')).toBeVisible()
  await expect(page).toHaveURL(/\/products\/new$/)
})

test('BUG-019 a fractional quantity is rejected', async ({ page }) => {
  seededDefect('BUG-019')
  await fillProductForm(page, { ...VALID_PRODUCT, quantity: '2.5' })
  await page.getByRole('button', { name: 'Create product' }).click()
  await expect(page.getByText('Quantity must be a whole number')).toBeVisible()
  await expect(page).toHaveURL(/\/products\/new$/)
})

test('BUG-020 a name made only of spaces counts as empty', async ({ page }) => {
  seededDefect('BUG-020')
  await fillProductForm(page, { ...VALID_PRODUCT, name: '      ' })
  await page.getByRole('button', { name: 'Create product' }).click()
  await expect(page.getByText('Product name is required')).toBeVisible()
  await expect(page).toHaveURL(/\/products\/new$/)
})

test('BUG-021 a 100-character name (the documented maximum) can be saved', async ({ page }) => {
  seededDefect('BUG-021')
  const name = 'Storage Box '.repeat(9).slice(0, 100)
  expect(name).toHaveLength(100)
  await fillProductForm(page, { ...VALID_PRODUCT, name })
  await page.getByRole('button', { name: 'Create product' }).click()
  await expect(page).toHaveURL(/\/products$/)
  await waitForProducts(page)
  await expect(productRows(page).first()).toContainText('OF-3999')
})

test('BUG-022 double-clicking Create product creates once with no error', async ({ page }) => {
  seededDefect('BUG-022')
  let posts = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/products') {
      posts += 1
    }
  })
  await fillProductForm(page, VALID_PRODUCT)
  await page.getByRole('button', { name: 'Create product' }).dblclick()
  await expect(page).toHaveURL(/\/products$/)
  await expect(page.getByText(`“${VALID_PRODUCT.name}” was created.`)).toBeVisible()
  await page.waitForTimeout(1000)
  await expect(page.getByText(/Couldn't create the product/)).toHaveCount(0)
  expect(posts).toBe(1)
})

test('BUG-023 the price error does not overlap other text', async ({ page }) => {
  seededDefect('BUG-023')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Create product' }).click()
  const error = page.getByText('Price is required')
  await expect(error).toBeVisible()
  const errorBox = await error.boundingBox()
  const others = [
    page.getByText('Between $0.01 and $99,999.99'),
    page.locator('label').filter({ hasText: 'Quantity in stock' }),
  ]
  for (const other of others) {
    const box = (await other.count()) > 0 ? await other.boundingBox() : null
    if (errorBox === null || box === null) {
      continue
    }
    const overlaps =
      errorBox.x < box.x + box.width &&
      box.x < errorBox.x + errorBox.width &&
      errorBox.y < box.y + box.height &&
      box.y < errorBox.y + errorBox.height
    expect(overlaps, `error ${JSON.stringify(errorBox)} vs ${JSON.stringify(box)}`).toBe(false)
  }
})

test('BUG-024 special characters in a name are saved as typed', async ({ page }) => {
  seededDefect('BUG-024')
  await fillProductForm(page, { ...VALID_PRODUCT, name: 'Salt & Vinegar <Party> Pack' })
  await page.getByRole('button', { name: 'Create product' }).click()
  await expect(page).toHaveURL(/\/products$/)
  await waitForProducts(page)
  await expect(productRows(page).first().getByRole('link').first()).toHaveText(
    'Salt & Vinegar <Party> Pack',
  )
})
