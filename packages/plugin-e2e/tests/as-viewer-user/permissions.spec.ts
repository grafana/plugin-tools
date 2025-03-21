import { expect, test } from '../../src';

test('should redirect to start page when permissions to navigate to page is missing', async ({ page }) => {
  await page.goto('/');
  await page.goto('/datasources');
  expect(new URL(page.url()).pathname).not.toContain('datasources');
});
