import { expect, test } from '../../../src';
import { lt } from 'semver';

test.use({
  featureToggles: {
    singleTestFlag: true,
  },
});

test('should intercept single flag evaluation endpoint', async ({ page, grafanaVersion }) => {
  test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');
  // Make a request to the single flag endpoint which will be intercepted
  const singleFlagResponse = await page.evaluate(async () => {
    try {
      const response = await fetch(
        '/apis/features.grafana.app/v0alpha1/namespaces/default/ofrep/v1/evaluate/flags/singleTestFlag'
      );
      if (response.ok) {
        return response.json();
      }
      return null;
    } catch {
      return null;
    }
  });

  if (singleFlagResponse) {
    expect(singleFlagResponse.key).toBe('singleTestFlag');
    expect(singleFlagResponse.value).toBe(true);
    expect(singleFlagResponse.reason).toBe('STATIC');
    expect(singleFlagResponse.variant).toBe('playwright-override');
  }
});
