// Facilitator-only: these tests describe seeded defects. Do not share with participants.
import type { Locator, Page } from '@playwright/test'

import { seededDefect } from '../support/defect.ts'
import { expect, signInAs, test, waitForProducts } from '../support/fixtures.ts'

function cardValue(page: Page, label: string): Locator {
  return page
    .getByRole('region', { name: 'Catalogue summary' })
    .locator('div.rounded-xl')
    .filter({ hasText: label })
    .locator('p')
    .nth(1)
}

test('BUG-006 Low stock counts products with exactly 10 units', async ({ page, request }) => {
  seededDefect('BUG-006')
  await signInAs(page, request, '/dashboard')
  // Seed data: 8, 0, 10, 3, 4 and 0 units are all "10 or fewer" (the list badges agree).
  await expect(cardValue(page, 'Low stock')).toHaveText('6')
})

test('BUG-007 Inventory value includes the cents of every price', async ({ page, request }) => {
  seededDefect('BUG-007')
  await signInAs(page, request, '/dashboard')
  // Σ price × quantity over the 16 seeded products.
  await expect(cardValue(page, 'Inventory value')).toHaveText('$56,178.09')
})

test('BUG-008 dashboard reports an error when the API is unreachable', async ({
  page,
  request,
}) => {
  seededDefect('BUG-008')
  await signInAs(page, request, '/products')
  await waitForProducts(page)
  await page.route('**/api/dashboard/summary', (route) => route.abort('connectionrefused'))
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Dashboard' })
    .click()
  await expect(page.getByText("We couldn't load the dashboard.")).toBeVisible()
  await expect(page.getByText('$0.00')).toHaveCount(0)
})
