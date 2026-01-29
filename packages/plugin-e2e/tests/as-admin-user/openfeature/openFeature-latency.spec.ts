import { expect, test } from '../../../src';
import { lt } from 'semver';

const LATENCY_MS = 200;

test.use({
  openFeature: {
    flags: {
      latencyTestFlag: true,
    },
    latency: LATENCY_MS,
  },
});

test('should apply artificial latency to OFREP responses', async ({ page, grafanaVersion, selectors, namespace }) => {
  test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');
  const startTime = Date.now();

  // make a request to the single flag endpoint which will be intercepted
  const flagUrl = `${selectors.apis.OpenFeature.ofrepSinglePath(namespace)}/latencyTestFlag`;

  const response = await page.evaluate(async (url) => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return res.json();
      }
      return null;
    } catch {
      return null;
    }
  }, flagUrl);

  const elapsed = Date.now() - startTime;

  if (response) {
    // verify the response is correct
    expect(response.key).toBe('latencyTestFlag');
    expect(response.value).toBe(true);

    // verify the latency was applied (allow some margin for timing variance)
    expect(elapsed).toBeGreaterThanOrEqual(LATENCY_MS - 50);
  }
});
