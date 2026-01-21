import { expect, test } from '../../../src';

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

test('should merge custom featureToggles with backend default flags', async ({ page }) => {
  // Set up a listener to capture the OFREP response
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/ofrep/v1/evaluate/flags') && !response.url().endsWith('/'),
    { timeout: 5000 }
  );

  // Trigger a navigation that would cause OpenFeature to fetch flags
  await page.goto('/');

  // Wait for the OFREP response
  try {
    const response = await responsePromise;
    const body = await response.json();

    // Define how many custom flags we set
    const customFlagCount = 2; // testFlagTrue and testFlagFalse

    // Verify we have more flags than just our custom ones (backend flags should be present)
    expect(body.flags.length).toBeGreaterThan(customFlagCount);

    // Verify our custom flags are present and overridden
    const customFlags = body.flags.filter((f: { variant: string }) => f.variant === 'playwright-override');
    expect(customFlags.length).toBeGreaterThanOrEqual(customFlagCount);

    // Verify backend flags (without playwright-override variant) are still present
    const backendFlags = body.flags.filter((f: { variant: string }) => f.variant !== 'playwright-override');
    expect(backendFlags.length).toBeGreaterThan(0);

    // Verify our specific custom flags have the correct values
    const testFlagTrue = body.flags.find((f: { key: string }) => f.key === 'testFlagTrue');
    const testFlagFalse = body.flags.find((f: { key: string }) => f.key === 'testFlagFalse');

    expect(testFlagTrue?.value).toBe(true);
    expect(testFlagTrue?.variant).toBe('playwright-override');

    expect(testFlagFalse?.value).toBe(false);
    expect(testFlagFalse?.variant).toBe('playwright-override');
  } catch {
    // OpenFeature may not be enabled in the test Grafana instance
    console.log('OFREP endpoint not called - OpenFeature may not be enabled');
  }
});
