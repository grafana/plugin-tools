import { expect, test } from '../../../src';

test.use({
  featureToggles: {
    localizationForPlugins: true,
  },
  userPreferences: {
    language: 'es-ES',
    theme: 'light',
  },
});

test.describe('defeault user preferences', () => {
  test('should use English language on profile page', async ({ page }) => {
    page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  });

  test('should use dark theme', async ({ page, selectors }) => {
    page.goto('/');
    const header = page.getByRole('banner');
    await expect(header).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  });
});
