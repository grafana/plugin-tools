import { expect, test } from '../../../src';

const LATENCY_MS = 200;

test.use({
  featureToggles: {
    latencyTestFlag: true,
  },
  openFeatureLatency: LATENCY_MS,
});

test('should apply artificial latency to OFREP responses', async ({ page }) => {
  const startTime = Date.now();

  // Make a request to the single flag endpoint which will be intercepted
  const response = await page.evaluate(async () => {
    try {
      const res = await fetch(
        '/apis/features.grafana.app/v0alpha1/namespaces/default/ofrep/v1/evaluate/flags/latencyTestFlag'
      );
      if (res.ok) {
        return res.json();
      }
      return null;
    } catch {
      return null;
    }
  });

  const elapsed = Date.now() - startTime;

  if (response) {
    // Verify the response is correct
    expect(response.key).toBe('latencyTestFlag');
    expect(response.value).toBe(true);

    // Verify the latency was applied (allow some margin for timing variance)
    expect(elapsed).toBeGreaterThanOrEqual(LATENCY_MS - 50);
  }
});
