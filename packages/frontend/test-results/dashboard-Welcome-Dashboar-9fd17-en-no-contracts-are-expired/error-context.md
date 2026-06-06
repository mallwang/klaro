# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Welcome Dashboard >> US4 – expired contracts panel has neutral empty state when no contracts are expired
- Location: tests/e2e/dashboard.spec.ts:91:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/no expired contracts/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/no expired contracts/i)

```

```yaml
- group "Language":
    - button "English" [pressed]
    - button "Deutsch"
- main:
    - heading "Dashboard" [level=1]
    - paragraph: Your contract overview
    - link "Manage Contracts":
        - /url: /contracts
    - region "Monthly Spending":
        - heading "Monthly Spending Monthly spending calculation info Average monthly cost across all active contracts. Yearly amounts ÷ 12, quarterly ÷ 3, weekly × 4.3. One-time (lifetime) contracts are excluded." [level=2]:
            - text: Monthly Spending
            - button "Monthly spending calculation info"
            - tooltip "Average monthly cost across all active contracts. Yearly amounts ÷ 12, quarterly ÷ 3, weekly × 4.3. One-time (lifetime) contracts are excluded."
        - paragraph: €233.81
        - paragraph: across all active contracts
    - region "By Category":
        - heading "By Category" [level=2]
        - table:
            - rowgroup:
                - row "Category Contracts Monthly Total":
                    - columnheader "Category"
                    - columnheader "Contracts"
                    - columnheader "Monthly Total"
            - rowgroup:
                - row "Subscriptions 19 €170.81":
                    - cell "Subscriptions"
                    - cell "19"
                    - cell "€170.81"
                - row "Housing 2 €63.00":
                    - cell "Housing"
                    - cell "2"
                    - cell "€63.00"
    - region "Upcoming Renewals":
        - heading "Upcoming Renewals" [level=2]
        - paragraph: No renewals due soon.
    - region "Expired Contracts":
        - heading "Expired Contracts" [level=2]
        - list:
            - listitem:
                - link "Embervault GmbH Subscriptions 05/27/2026 10 days overdue":
                    - /url: /contracts/e6eae28a-edcb-409f-b521-ca30a5b9595a/edit
            - listitem:
                - link "Paramount+ Subscriptions 03/22/2026 76 days overdue":
                    - /url: /contracts/697f1b1f-4e7c-4657-858a-7935196f42f9/edit
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test.describe('Cancellation-Aware Renewals Panel', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('http://localhost:5174');
  6  |   });
  7  |
  8  |   test('US2 – overdue contract shows a destructive badge with days-overdue count', async ({
  9  |     page,
  10 |   }) => {
  11 |     // The seeded DB or live backend must have a contract whose cancellation deadline has
  12 |     // already passed (daysUntilCancellationDeadline < 0) for this test to be meaningful.
  13 |     // This test verifies the badge variant is destructive and the text includes "overdue".
  14 |     const panel = page.locator('.upcoming-renewals__list');
  15 |     const overdueItems = panel.locator('[data-overdue="true"]');
  16 |     // If there are any overdue items, confirm they show "overdue" text
  17 |     const count = await overdueItems.count();
  18 |     if (count > 0) {
  19 |       await expect(overdueItems.first().locator('[data-testid="urgency-badge"]')).toContainText(
  20 |         'overdue',
  21 |       );
  22 |     }
  23 |     // Verify that no overdue badge accidentally appears with "remaining" text
  24 |     const remainingBadges = panel.locator('[data-testid="urgency-badge"]', {
  25 |       hasText: /overdue/,
  26 |     });
  27 |     for (let i = 0; i < (await remainingBadges.count()); i++) {
  28 |       const item = remainingBadges.nth(i);
  29 |       await expect(item).not.toContainText('remaining');
  30 |     }
  31 |   });
  32 |
  33 |   test('US3 – each panel entry shows both "Cancel by" and "Ends" labels', async ({ page }) => {
  34 |     const panel = page.locator('.upcoming-renewals__list');
  35 |     const items = panel.locator('.upcoming-renewals__item');
  36 |     const count = await items.count();
  37 |     if (count > 0) {
  38 |       const firstItem = items.first();
  39 |       await expect(firstItem.locator('.upcoming-renewals__cancel-by-label')).toBeVisible();
  40 |       await expect(firstItem.locator('.upcoming-renewals__ends-on-label')).toBeVisible();
  41 |     }
  42 |   });
  43 | });
  44 |
  45 | test.describe('Welcome Dashboard', () => {
  46 |   test.beforeEach(async ({ page }) => {
  47 |     await page.goto('http://localhost:5174');
  48 |   });
  49 |
  50 |   test('US1 – shows total monthly spending', async ({ page }) => {
  51 |     await expect(page.getByRole('heading', { name: /monthly spending/i })).toBeVisible();
  52 |     const total = page.locator('.spending-overview__total');
  53 |     await expect(total).toBeVisible();
  54 |   });
  55 |
  56 |   test('US2 – shows contracts grouped by category', async ({ page }) => {
  57 |     const section = page.getByRole('region', { name: 'Contracts by category' });
  58 |     await expect(section.getByRole('heading', { name: /by category/i })).toBeVisible();
  59 |     await expect(section.getByText('Housing')).toBeVisible();
  60 |     await expect(section.getByText('Utilities')).toBeVisible();
  61 |     await expect(section.getByText('Subscriptions')).toBeVisible();
  62 |   });
  63 |
  64 |   test('US3 – shows upcoming renewals section', async ({ page }) => {
  65 |     await expect(page.getByRole('heading', { name: /upcoming renewals/i })).toBeVisible();
  66 |   });
  67 |
  68 |   test('all three sections visible without scrolling at 1280x800', async ({ page }) => {
  69 |     await page.setViewportSize({ width: 1280, height: 800 });
  70 |     await page.goto('http://localhost:5174');
  71 |
  72 |     const spending = page.getByRole('heading', { name: /monthly spending/i });
  73 |     const category = page.getByRole('heading', { name: /by category/i });
  74 |     const renewals = page.getByRole('heading', { name: /upcoming renewals/i });
  75 |
  76 |     await expect(spending).toBeInViewport();
  77 |     await expect(category).toBeInViewport();
  78 |     await expect(renewals).toBeInViewport();
  79 |   });
  80 |
  81 |   test('empty state – no contracts shows zero total', async ({ page }) => {
  82 |     await expect(
  83 |       page.locator('.spending-overview__total, .spending-overview__empty'),
  84 |     ).toBeVisible();
  85 |   });
  86 |
  87 |   test('US4 – shows expired contracts section heading', async ({ page }) => {
  88 |     await expect(page.getByRole('heading', { name: /expired contracts/i })).toBeVisible();
  89 |   });
  90 |
  91 |   test('US4 – expired contracts panel has neutral empty state when no contracts are expired', async ({
  92 |     page,
  93 |   }) => {
> 94 |     await expect(page.getByText(/no expired contracts/i)).toBeVisible();
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  95 |     const section = page.getByRole('region', { name: /expired contracts/i });
  96 |     await expect(section.locator('.border-amber-200')).toHaveCount(0);
  97 |   });
  98 | });
  99 |
```
