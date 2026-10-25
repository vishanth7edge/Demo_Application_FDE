import { test as base, expect } from '@playwright/test'
import type { APIRequestContext, Locator, Page } from '@playwright/test'

export { expect }

/** The e2e API (see playwright.config.ts). Called directly for setup, never through the UI proxy. */
export const API_URL = 'http://127.0.0.1:4100'
const TOKEN_KEY = 'buggy-store.token'

export interface DemoUser {
  email: string
  password: string
  name: string
}

export const ADMIN: DemoUser = {
  email: 'admin@buggystore.test',
  password: 'Admin@123',
  name: 'Jordan Lee',
}
export const VIEWER: DemoUser = {
  email: 'viewer@buggystore.test',
  password: 'Viewer@123',
  name: 'Sam Rivera',
}

/** Every test starts from the known 16-product dataset with nobody signed in. */
export const test = base.extend<{ resetDatabase: undefined }>({
  resetDatabase: [
    async ({ request }, use) => {
      const response = await request.post(`${API_URL}/api/test/reset`)
      expect(response.status()).toBe(204)
      await use(undefined)
    },
    { auto: true },
  ],
})

export async function apiToken(
  request: APIRequestContext,
  user: DemoUser = ADMIN,
): Promise<string> {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password },
  })
  expect(response.ok()).toBe(true)
  const body = (await response.json()) as { token: string }
  return body.token
}

/** Signs in through the login form and waits for the dashboard. */
export async function signIn(page: Page, user: DemoUser = ADMIN): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(user.email)
  await page.getByLabel(/^Password/).fill(user.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

/** Fast sign-in: stores an API token, then opens `path`. */
export async function signInAs(
  page: Page,
  request: APIRequestContext,
  path: string,
  user: DemoUser = ADMIN,
): Promise<void> {
  const token = await apiToken(request, user)
  await page.goto('/login')
  await page.evaluate(
    ([key, value]) => {
      localStorage.setItem(key, value)
    },
    [TOKEN_KEY, token] as const,
  )
  await page.goto(path)
}

export function productRows(page: Page): Locator {
  return page.getByRole('region', { name: 'Product list' }).locator('tbody tr')
}

/** Waits until the product table has settled (not busy) and shows at least one row. */
export async function waitForProducts(page: Page): Promise<void> {
  const table = page.getByRole('region', { name: 'Product list' }).getByRole('table')
  await expect(table).toHaveAttribute('aria-busy', 'false')
  await expect(productRows(page).first()).toBeVisible()
}

/** Text of one cell per row; columns: 0 product, 1 category, 2 price, 3 stock, 4 status, 5 created. */
export async function columnTexts(page: Page, column: number): Promise<string[]> {
  return productRows(page)
    .locator(`td:nth-child(${String(column + 1)})`)
    .allInnerTexts()
}

export function rowFor(page: Page, sku: string): Locator {
  return productRows(page).filter({ hasText: sku })
}

export function parseMoney(text: string): number {
  return Number(text.replace(/[$,\s]/g, ''))
}

export async function createProductViaApi(
  request: APIRequestContext,
  product: {
    name: string
    sku: string
    category?: string
    price?: number
    quantity?: number
    status?: string
  },
): Promise<{ id: number }> {
  const token = await apiToken(request)
  const response = await request.post(`${API_URL}/api/products`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { category: 'Apparel', price: 10, quantity: 5, status: 'active', ...product },
  })
  expect(response.status()).toBe(201)
  return (await response.json()) as { id: number }
}

/** Fills the add/edit product form. Only the given fields are changed. */
export async function fillProductForm(
  page: Page,
  values: Partial<Record<'name' | 'sku' | 'category' | 'price' | 'quantity' | 'status', string>>,
): Promise<void> {
  if (values.name !== undefined) {
    await page.getByLabel(/^Product name/).fill(values.name)
  }
  if (values.sku !== undefined) {
    await page.getByLabel(/^SKU/).fill(values.sku)
  }
  if (values.category !== undefined) {
    await page.getByLabel(/^Category/).selectOption(values.category)
  }
  if (values.price !== undefined) {
    await page.getByLabel(/^Price/).fill(values.price)
  }
  if (values.quantity !== undefined) {
    await page.getByLabel(/^Quantity in stock/).fill(values.quantity)
  }
  if (values.status !== undefined) {
    await page.getByLabel(/^Status/).selectOption(values.status)
  }
}

export const VALID_PRODUCT = {
  name: 'Bamboo Desk Organizer',
  sku: 'OF-3999',
  category: 'Office Supplies',
  price: '27.40',
  quantity: '40',
  status: 'active',
} as const
