import { expect, test } from '../../../src';

// No featureToggles specified - should work unchanged
test('should work without featureToggles option', async ({ page }) => {
  // Simply verify the page loads without errors
  await page.goto('/');
  await expect(page).toHaveURL(/.*\//);
});
