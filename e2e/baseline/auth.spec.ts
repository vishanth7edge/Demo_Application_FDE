import { ADMIN, API_URL, expect, signIn, signInAs, test, VIEWER } from '../support/fixtures.ts'

test.describe('Authentication', () => {
  test('anonymous visitors are sent to the login page', async ({ page }) => {
    await page.goto('/products')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Sign in to Buggy Store' })).toBeVisible()
  })

  test('required fields are validated before submitting', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Email address is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('wrong credentials show a generic error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email address').fill(ADMIN.email)
    await page.getByLabel(/^Password/).fill('not-the-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('alert')).toHaveText('Invalid email or password.')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('the password can be shown and hidden', async ({ page }) => {
    await page.goto('/login')
    const password = page.getByLabel(/^Password/)
    await password.fill('secret')
    await expect(password).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Show password' }).click()
    await expect(password).toHaveAttribute('type', 'text')
    await page.getByRole('button', { name: 'Hide password' }).click()
    await expect(password).toHaveAttribute('type', 'password')
  })

  test('an admin can sign in and the session survives a reload', async ({ page }) => {
    await signIn(page, ADMIN)
    await expect(page.getByText('Welcome back, Jordan.')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('email addresses are matched case-insensitively', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email address').fill('ADMIN@BuggyStore.test')
    await page.getByLabel(/^Password/).fill(ADMIN.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('signing out returns to the login page and protects pages again', async ({ page }) => {
    await signIn(page, ADMIN)
    await page.getByRole('link', { name: 'Products' }).click()
    await expect(page).toHaveURL(/\/products$/)
    await page.getByText('Logout').click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByText("You've been signed out.")).toBeVisible()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('an expired session sends the user back to sign in with an explanation', async ({
    page,
    request,
  }) => {
    await signInAs(page, request, '/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await request.post(`${API_URL}/api/test/expire-sessions`)
    await page.getByRole('link', { name: 'Products' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByText('Your session has expired. Please sign in again.')).toBeVisible()
  })

  test('signed-in users visiting /login go to the dashboard', async ({ page, request }) => {
    await signInAs(page, request, '/login')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})

test.describe('Forgot password', () => {
  test('validates the email field', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL(/\/forgot-password$/)
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByText('Email address is required')).toBeVisible()
    await page.getByLabel('Email address').fill('not-an-email')
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByText(/Enter a valid email address/)).toBeVisible()
  })

  test('a known address gets a confirmation and can return to sign in', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel('Email address').fill(VIEWER.email)
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByText('Check your inbox')).toBeVisible()
    await page.getByRole('link', { name: 'Return to sign in' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('Roles', () => {
  test('viewers get a read-only product list', async ({ page, request }) => {
    await signInAs(page, request, '/products', VIEWER)
    await expect(page.getByText('Viewer (read-only)')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit Yoga Mat Pro 6mm' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Add product' })).toHaveCount(0)
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toHaveCount(0)
  })

  test('viewers cannot open the add or edit forms by URL', async ({ page, request }) => {
    await signInAs(page, request, '/products/new', VIEWER)
    await expect(page).toHaveURL(/\/products$/)
    await expect(page.getByText("You don't have permission to add or edit products.")).toBeVisible()
    await page.goto('/products/12/edit')
    await expect(page).toHaveURL(/\/products$/)
  })
})
