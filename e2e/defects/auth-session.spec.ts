// Facilitator-only: these tests describe seeded defects. Do not share with participants.
import { seededDefect } from '../support/defect.ts'
import {
  ADMIN,
  expect,
  signIn,
  signInAs,
  test,
  VIEWER,
  waitForProducts,
} from '../support/fixtures.ts'

test('BUG-001 sign-in accepts an email pasted with surrounding spaces', async ({ page }) => {
  seededDefect('BUG-001')
  await page.goto('/login')
  await page.getByLabel('Email address').fill(`  ${ADMIN.email} `)
  await page.getByLabel(/^Password/).fill(ADMIN.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('BUG-002 after sign-in the user returns to the page they asked for', async ({ page }) => {
  seededDefect('BUG-002')
  await page.goto('/products?category=Electronics')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Email address').fill(ADMIN.email)
  await page.getByLabel(/^Password/).fill(ADMIN.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/products\?category=Electronics$/)
})

test('BUG-003 logging out in one tab ends the session in other tabs', async ({ page, context }) => {
  seededDefect('BUG-003')
  await signIn(page)
  const otherTab = await context.newPage()
  await otherTab.goto('/products')
  await waitForProducts(otherTab)

  await page.getByText('Logout').click()
  await expect(page).toHaveURL(/\/login$/)

  // The other tab still holds the old token in memory; its next request must be rejected.
  await otherTab
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Dashboard' })
    .click()
  await expect(otherTab).toHaveURL(/\/login$/)
})

test('BUG-004 forgot password does not reveal whether an account exists', async ({ page }) => {
  seededDefect('BUG-004')
  await page.goto('/forgot-password')
  await page.getByLabel('Email address').fill('nobody@buggystore.test')
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByText('Check your inbox')).toBeVisible()
})

test('BUG-005 forgot password accepts a valid address containing "+"', async ({ page }) => {
  seededDefect('BUG-005')
  await page.goto('/forgot-password')
  await page.getByLabel('Email address').fill('qa+reset@buggystore.test')
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByText('Check your inbox')).toBeVisible()
})

test('BUG-032 viewers do not see Edit or Delete on the product detail page', async ({
  page,
  request,
}) => {
  seededDefect('BUG-032')
  await signInAs(page, request, '/products/12', VIEWER)
  await expect(page.getByRole('heading', { name: 'Yoga Mat Pro 6mm' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Edit' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0)
})

test('BUG-033 Logout can be reached and used with the keyboard', async ({ page, request }) => {
  seededDefect('BUG-033')
  await signInAs(page, request, '/dashboard')
  await expect(page.getByText('Inventory value')).toBeVisible()
  // Logout is the next control after the last navigation link in the sidebar.
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Products' })
    .focus()
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toHaveText('Logout')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/login$/)
})
