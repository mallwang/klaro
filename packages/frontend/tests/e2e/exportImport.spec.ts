import { test, expect } from '@playwright/test';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

test.describe('Contract Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/contracts');
  });

  test('US1 – Export menu button is visible on contracts page', async ({ page }) => {
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
  });

  test('US1 – Export to JSON downloads a file', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export/i }).click();
    await page.getByRole('menuitem', { name: /json/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^contracts-\d{4}-\d{2}-\d{2}\.json$/);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const content = fs.readFileSync(filePath!, 'utf-8');
    const parsed = JSON.parse(content) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    if (parsed.length > 0) {
      const first = parsed[0] as Record<string, unknown>;
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('amount');
      expect(first).toHaveProperty('billingInterval');
    }
  });

  test('US1 – Export to Excel downloads a file', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export/i }).click();
    await page.getByRole('menuitem', { name: /excel/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^contracts-\d{4}-\d{2}-\d{2}\.xlsx$/);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const stat = fs.statSync(filePath!);
    expect(stat.size).toBeGreaterThan(0);
  });
});

test.describe('Contract Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/contracts');
  });

  test('US2 – Import link is visible on contracts page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /import/i })).toBeVisible();
  });

  test('US2 – Import page renders file upload area', async ({ page }) => {
    await page.goto('http://localhost:5174/contracts/import');
    await expect(page.getByRole('heading', { name: /import/i })).toBeVisible();
  });

  test('US2 – Upload JSON with non-standard columns shows mapping preview', async ({ page }) => {
    await page.goto('http://localhost:5174/contracts/import');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pcm-test-'));
    const tmpFile = path.join(tmpDir, 'test-import.json');
    fs.writeFileSync(
      tmpFile,
      JSON.stringify([
        {
          'Contract Name': 'Test Import Sub',
          'Monthly Cost': 9.99,
          'Billing Frequency': 'MONTHLY',
          Type: 'SUBSCRIPTIONS',
        },
      ]),
    );

    await page.getByLabel(/file/i).setInputFiles(tmpFile);
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Contract Name')).toBeVisible();
    await expect(page.getByText('name')).toBeVisible();

    fs.rmSync(tmpDir, { recursive: true });
  });

  test('US2 – Confirm import creates contract and shows result', async ({ page }) => {
    await page.goto('http://localhost:5174/contracts/import');

    const uniqueName = `Import Test ${Date.now()}`;
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pcm-test-'));
    const tmpFile = path.join(tmpDir, 'test-import.json');
    fs.writeFileSync(
      tmpFile,
      JSON.stringify([
        {
          name: uniqueName,
          amount: 5.0,
          billingInterval: 'MONTHLY',
          category: 'OTHER',
        },
      ]),
    );

    await page.getByLabel(/file/i).setInputFiles(tmpFile);
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /confirm/i }).click();
    await expect(page.getByText(/created/i)).toBeVisible({ timeout: 5000 });

    fs.rmSync(tmpDir, { recursive: true });
  });

  test('US3 – Unmapped column can be reassigned via dropdown', async ({ page }) => {
    await page.goto('http://localhost:5174/contracts/import');

    const uniqueName = `Override Test ${Date.now()}`;
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pcm-test-'));
    const tmpFile = path.join(tmpDir, 'test-override.json');
    fs.writeFileSync(
      tmpFile,
      JSON.stringify([
        {
          name: uniqueName,
          amount: 1.0,
          billingInterval: 'MONTHLY',
          category: 'OTHER',
          Vendor: 'Some vendor info',
        },
      ]),
    );

    await page.getByLabel(/file/i).setInputFiles(tmpFile);
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });

    const vendorRow = page.locator('tr').filter({ hasText: 'Vendor' });
    const select = vendorRow.getByRole('combobox');
    await select.selectOption('details');
    await expect(select).toHaveValue('details');

    fs.rmSync(tmpDir, { recursive: true });
  });

  test('US3 – Confirm is disabled when required field is unmapped', async ({ page }) => {
    await page.goto('http://localhost:5174/contracts/import');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pcm-test-'));
    const tmpFile = path.join(tmpDir, 'test-missing.json');
    fs.writeFileSync(
      tmpFile,
      JSON.stringify([
        {
          amount: 5.0,
          billingInterval: 'MONTHLY',
          category: 'OTHER',
        },
      ]),
    );

    await page.getByLabel(/file/i).setInputFiles(tmpFile);
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });

    const confirmBtn = page.getByRole('button', { name: /confirm/i });
    await expect(confirmBtn).toBeDisabled();

    fs.rmSync(tmpDir, { recursive: true });
  });

  test('US3 – Column can be skipped', async ({ page }) => {
    await page.goto('http://localhost:5174/contracts/import');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pcm-test-'));
    const tmpFile = path.join(tmpDir, 'test-skip.json');
    fs.writeFileSync(
      tmpFile,
      JSON.stringify([
        {
          name: 'Skip Test',
          amount: 2.0,
          billingInterval: 'YEARLY',
          category: 'OTHER',
          Vendor: 'Should be skipped',
        },
      ]),
    );

    await page.getByLabel(/file/i).setInputFiles(tmpFile);
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });

    const vendorRow = page.locator('tr').filter({ hasText: 'Vendor' });
    const select = vendorRow.getByRole('combobox');
    await select.selectOption('__skip__');
    await expect(select).toHaveValue('__skip__');

    fs.rmSync(tmpDir, { recursive: true });
  });
});
