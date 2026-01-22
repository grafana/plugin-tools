import { expect, test } from '../../../src';
import { lt } from 'semver';

test.use({
  featureToggles: {
    singleTestFlag: true,
  },
});

test('should intercept single flag evaluation endpoint', async ({ page, grafanaVersion, selectors, namespace }) => {
  test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');
  // make a request to the single flag endpoint which will be intercepted
  const flagUrl = `${selectors.apis.OpenFeature.ofrepSinglePath(namespace)}/singleTestFlag`;

  const singleFlagResponse = await page.evaluate(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
      return null;
    } catch {
      return null;
    }
  }, flagUrl);

  if (singleFlagResponse) {
    expect(singleFlagResponse.key).toBe('singleTestFlag');
    expect(singleFlagResponse.value).toBe(true);
    expect(singleFlagResponse.reason).toBe('STATIC');
    expect(singleFlagResponse.variant).toBe('playwright-override');
  }
});
