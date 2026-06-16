import { test, expect } from '@playwright/test';

test.describe('FAQ Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.evaluate(() => localStorage.removeItem('pcm-lang'));
  });

  test('US1 – FAQ link is visible in the sidebar navigation', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await expect(page.getByRole('link', { name: /^faq$/i })).toBeVisible();
  });

  test('US1 – navigating to /faq shows the FAQ page heading', async ({ page }) => {
    await page.goto('http://localhost:5174/faq');
    await expect(page.getByRole('heading', { name: /frequently asked questions/i })).toBeVisible();
  });

  test('US1 – FAQ page displays accordion with multiple questions', async ({ page }) => {
    await page.goto('http://localhost:5174/faq');
    const buttons = page.getByRole('button', { name: /How do I add a new contract\?/i });
    await expect(buttons.first()).toBeVisible();
  });

  test('US1 – clicking an accordion item expands its answer', async ({ page }) => {
    await page.goto('http://localhost:5174/faq');
    const firstQuestion = page.getByRole('button', {
      name: /How do I add a new contract\?/i,
    });
    await firstQuestion.click();
    await expect(page.getByText(/Navigate to the Contracts page/i)).toBeVisible();
  });

  test('US1 – FAQ page shows a decorative image', async ({ page }) => {
    await page.goto('http://localhost:5174/faq');
    const img = page.getByRole('img', { name: /frequently asked questions/i });
    await expect(img).toBeVisible();
  });

  test('US1 – FAQ page displays content in German when language is switched', async ({ page }) => {
    await page.goto('http://localhost:5174/faq');

    // Switch to German
    const deButton = page.getByRole('button', { name: /Deutsch|DE/i });
    if (await deButton.isVisible()) {
      await deButton.click();
    } else {
      await page
        .locator('select')
        .filter({ hasText: /Deutsch|DE/i })
        .selectOption('de');
    }

    await expect(page.getByRole('heading', { name: /Häufig gestellte Fragen/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Wie füge ich einen neuen Vertrag hinzu\?/i }),
    ).toBeVisible();
  });
});
