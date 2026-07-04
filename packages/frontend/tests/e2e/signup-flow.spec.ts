import { test, expect, type Page } from '@playwright/test';

// These flows start as an unauthenticated visitor (public sign-up/verify pages), unlike most
// specs in this suite which reuse the pre-authenticated member session from playwright.config.ts.
test.use({ storageState: { cookies: [], origins: [] } });

const ADMIN = {
  email: 'admin@example.test',
  password: 'dev-admin-pass',
};

async function signInAsAdmin(page: Page) {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(ADMIN.email);
  await page.getByLabel(/password/i).fill(ADMIN.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/');
}

async function submitSignup(page: Page, email: string, password: string): Promise<string> {
  await page.goto('/sign-up');

  let signupToken: string | null = null;
  page.on('response', async (response) => {
    if (response.url().endsWith('/api/signup') && response.request().method() === 'POST') {
      try {
        const body = (await response.json()) as { token?: string };
        if (body.token) signupToken = body.token;
      } catch {
        // ignore
      }
    }
  });

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign up/i }).click();

  await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10_000 });
  expect(signupToken).not.toBeNull();
  return signupToken!;
}

async function requestSignup(
  page: Page,
  email: string,
  password: string,
): Promise<{ status: number; token?: string }> {
  const res = await page.request.post('/api/signup', { data: { email, password } });
  const body = res.ok() ? ((await res.json()) as { token?: string }) : undefined;
  return { status: res.status(), token: body?.token };
}

test.describe('Self-service sign-up flow (US1 → US3)', () => {
  test('visitor signs up, verifies, admin approves, and the new user signs in', async ({
    page,
  }) => {
    const email = `signup-e2e-${Date.now()}@example.test`;
    const password = 'a-strong-passphrase-e2e';

    const token = await submitSignup(page, email, password);

    // Visitor opens the verification link
    await page.goto(`/signup/verify/${token}`);
    await expect(page.getByText(/verified/i)).toBeVisible({ timeout: 10_000 });

    // Admin reviews and approves the now-pending request
    await signInAsAdmin(page);
    await page.goto('/admin/accounts');

    // Scope to the sign-up-request row specifically (not the accounts table row that will
    // appear for this same email once approved) by requiring both the email and the
    // "awaiting approval" status text within the same row.
    const row = page
      .locator('tr, [data-testid="signup-request-card"]')
      .filter({ hasText: email })
      .filter({ hasText: /awaiting approval/i });
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.getByRole('button', { name: /approve/i }).click();

    // The approved request disappears from the sign-up requests table (FR-008) — the email
    // now appears only in the accounts table above, as a newly created active user
    await expect(row).toHaveCount(0, { timeout: 10_000 });

    // Sign out as admin, then sign in as the newly-approved user
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL('/sign-in');

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10_000 });
  });
});

test.describe('Self-service sign-up rejection (US4)', () => {
  test('reject blocks resubmission until the entry is deleted', async ({ page }) => {
    const email = `signup-reject-e2e-${Date.now()}@example.test`;
    const password = 'a-strong-passphrase-e2e';

    const token = await submitSignup(page, email, password);
    await page.goto(`/signup/verify/${token}`);
    await expect(page.getByText(/verified/i)).toBeVisible({ timeout: 10_000 });

    await signInAsAdmin(page);
    await page.goto('/admin/accounts');

    const row = page.locator('tr, [data-testid="signup-request-card"]', { hasText: email }).first();
    await row.getByRole('button', { name: /reject/i }).click();

    const rejectDialog = page.getByRole('dialog');
    await expect(rejectDialog).toBeVisible({ timeout: 10_000 });
    await rejectDialog.getByRole('button', { name: /reject/i }).click();
    await expect(rejectDialog).toHaveCount(0, { timeout: 10_000 });

    // The request now shows as rejected
    await expect(row.getByText(/rejected/i)).toBeVisible({ timeout: 10_000 });

    // Resubmitting the same address is blocked while the rejected entry persists
    const blocked = await requestSignup(page, email, 'try-again-passphrase');
    expect(blocked.status).toBe(409);

    // Deleting the entry frees the address for a fresh sign-up
    await page.reload();
    const rejectedRow = page
      .locator('tr, [data-testid="signup-request-card"]', { hasText: email })
      .first();
    await rejectedRow.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByText(email)).toHaveCount(0, { timeout: 10_000 });

    const allowed = await requestSignup(page, email, 'try-again-passphrase');
    expect(allowed.status).toBe(201);
  });
});
