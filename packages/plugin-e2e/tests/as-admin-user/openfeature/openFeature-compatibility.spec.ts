import { expect, test } from '../../../src';
import { lt } from 'semver';

// no featureToggles specified - should work unchanged
test('should work without featureToggles option', async ({ page, grafanaVersion }) => {
  test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');
  // simply verify the page loads without errors
  await page.goto('/');
  await expect(page).toHaveURL(/.*\//);
});
