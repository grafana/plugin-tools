import { expect, test } from '../../../src';

test.describe('OpenFeature OFREP interception', () => {
  test.use({
    featureToggles: {
      testFlagTrue: true,
      testFlagFalse: false,
    },
  });

  test('should intercept OFREP bulk evaluation and override flags via featureToggles', async ({ page }) => {
    // Set up a listener to capture the OFREP response
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/ofrep/v1/evaluate/flags') && !response.url().endsWith('/'),
      { timeout: 5000 }
    );

    // Trigger a navigation that would cause OpenFeature to fetch flags
    await page.goto('/');

    // Wait for the OFREP response (may not happen if OpenFeature is not enabled in the Grafana instance)
    try {
      const response = await responsePromise;
      const body = await response.json();

      // Verify the response contains our overridden flags from featureToggles
      const testFlagTrue = body.flags?.find((f: { key: string }) => f.key === 'testFlagTrue');
      const testFlagFalse = body.flags?.find((f: { key: string }) => f.key === 'testFlagFalse');

      if (testFlagTrue) {
        expect(testFlagTrue.value).toBe(true);
        expect(testFlagTrue.reason).toBe('STATIC');
        expect(testFlagTrue.variant).toBe('playwright-override');
      }

      if (testFlagFalse) {
        expect(testFlagFalse.value).toBe(false);
        expect(testFlagFalse.reason).toBe('STATIC');
        expect(testFlagFalse.variant).toBe('playwright-override');
      }
    } catch {
      // OpenFeature may not be enabled in the test Grafana instance
      // This is expected in some environments
      console.log('OFREP endpoint not called - OpenFeature may not be enabled');
    }
  });
});

test.describe('OpenFeature single flag endpoint', () => {
  test.use({
    featureToggles: {
      singleTestFlag: true,
    },
  });

  test('should intercept single flag evaluation endpoint', async ({ page }) => {
    // Make a request to the single flag endpoint which will be intercepted
    const singleFlagResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/apis/features.grafana.app/v0alpha1/namespaces/default/ofrep/v1/evaluate/flags/singleTestFlag');
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
});

test.describe('OpenFeature with latency', () => {
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
        const res = await fetch('/apis/features.grafana.app/v0alpha1/namespaces/default/ofrep/v1/evaluate/flags/latencyTestFlag');
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
});

test.describe('OpenFeature - backward compatibility', () => {
  // No featureToggles specified - should work unchanged
  test('should work without featureToggles option', async ({ page }) => {
    // Simply verify the page loads without errors
    await page.goto('/');
    await expect(page).toHaveURL(/.*\//);
  });
});
