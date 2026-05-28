import { expect, test } from '../../src';

test('should redirect to start page when permissions to navigate to page is missing', async ({ page }) => {
  await page.goto('/');
  await page.goto('/datasources');
  // viewer lacks /datasources permission; wait for Grafana to redirect away rather
  // than relying on `networkidle`, which is flaky under slow CI.
  await expect(page).not.toHaveURL(/\/datasources/, { timeout: 15_000 });
});
