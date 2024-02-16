import { expect, test } from '../../src';

test('should redirect to start page when permissions to navigate to page is missing', async ({ page }) => {
  await page.goto('/');
  const homePageTitle = await page.title();
  await page.goto('/datasources', { waitUntil: 'networkidle' });
  expect(await page.title()).toEqual(homePageTitle);
});
