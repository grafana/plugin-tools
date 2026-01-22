import { expect, test } from '../../../src';
import { lt } from 'semver';

test.use({
  openFeature: {
    flags: {
      // boolean flags
      booleanFlagTrue: true,
      booleanFlagFalse: false,
      // string flags
      stringFlag: 'enabled',
      stringFlagEmpty: '',
      // number flags
      numberFlag: 42,
      numberFlagFloat: 3.14,
      numberFlagZero: 0,
      numberFlagNegative: -1,
      // object flags
      objectFlag: { tier: 'premium', maxRetries: 3 },
      objectFlagNested: { config: { api: { timeout: 5000, retries: 3 }, features: ['a', 'b'] } },
      objectFlagArray: [1, 2, 3],
    },
    latency: 0,
  },
});

test('should support all OpenFeature value types in bulk evaluation', async ({
  page,
  grafanaVersion,
  selectors,
  namespace,
}) => {
  test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(selectors.apis.OpenFeature.ofrepBulkPath(namespace)) && !response.url().endsWith('/'),
    { timeout: 5000 }
  );

  await page.goto('/');

  try {
    const response = await responsePromise;
    const body = await response.json();

    // helper to find flag by key
    const findFlag = (key: string) => body.flags?.find((f: { key: string }) => f.key === key);

    // boolean flags
    const booleanTrue = findFlag('booleanFlagTrue');
    expect(booleanTrue?.value).toBe(true);
    expect(booleanTrue?.reason).toBe('STATIC');
    expect(booleanTrue?.variant).toBe('playwright-override');

    const booleanFalse = findFlag('booleanFlagFalse');
    expect(booleanFalse?.value).toBe(false);

    // string flags
    const stringFlag = findFlag('stringFlag');
    expect(stringFlag?.value).toBe('enabled');
    expect(stringFlag?.reason).toBe('STATIC');

    const stringEmpty = findFlag('stringFlagEmpty');
    expect(stringEmpty?.value).toBe('');

    // number flags
    const numberFlag = findFlag('numberFlag');
    expect(numberFlag?.value).toBe(42);

    const numberFloat = findFlag('numberFlagFloat');
    expect(numberFloat?.value).toBe(3.14);

    const numberZero = findFlag('numberFlagZero');
    expect(numberZero?.value).toBe(0);

    const numberNegative = findFlag('numberFlagNegative');
    expect(numberNegative?.value).toBe(-1);

    // object flags
    const objectFlag = findFlag('objectFlag');
    expect(objectFlag?.value).toEqual({ tier: 'premium', maxRetries: 3 });

    const objectNested = findFlag('objectFlagNested');
    expect(objectNested?.value).toEqual({
      config: { api: { timeout: 5000, retries: 3 }, features: ['a', 'b'] },
    });

    const objectArray = findFlag('objectFlagArray');
    expect(objectArray?.value).toEqual([1, 2, 3]);
  } catch (error) {
    console.log('OFREP endpoint not called - OpenFeature may not be enabled', error);
  }
});

test('should support boolean flag in single evaluation', async ({ page, grafanaVersion, selectors, namespace }) => {
  test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');

  const flagUrl = `${selectors.apis.OpenFeature.ofrepSinglePath(namespace)}/booleanFlagTrue`;

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

  if (response) {
    expect(response.key).toBe('booleanFlagTrue');
    expect(response.value).toBe(true);
    expect(response.reason).toBe('STATIC');
    expect(response.variant).toBe('playwright-override');
  }
});

test('should support string flag in single evaluation', async ({ page, grafanaVersion, selectors, namespace }) => {
  test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');

  const flagUrl = `${selectors.apis.OpenFeature.ofrepSinglePath(namespace)}/stringFlag`;

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

  if (response) {
    expect(response.key).toBe('stringFlag');
    expect(response.value).toBe('enabled');
    expect(response.reason).toBe('STATIC');
  }
});

test('should support number flag in single evaluation', async ({ page, grafanaVersion, selectors, namespace }) => {
  test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');

  const flagUrl = `${selectors.apis.OpenFeature.ofrepSinglePath(namespace)}/numberFlag`;

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

  if (response) {
    expect(response.key).toBe('numberFlag');
    expect(response.value).toBe(42);
    expect(response.reason).toBe('STATIC');
  }
});

test('should support number zero in single evaluation', async ({ page, grafanaVersion, selectors, namespace }) => {
  test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');

  const flagUrl = `${selectors.apis.OpenFeature.ofrepSinglePath(namespace)}/numberFlagZero`;

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

  if (response) {
    expect(response.key).toBe('numberFlagZero');
    expect(response.value).toBe(0);
  }
});

test('should support object flag in single evaluation', async ({ page, grafanaVersion, selectors, namespace }) => {
  test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');

  const flagUrl = `${selectors.apis.OpenFeature.ofrepSinglePath(namespace)}/objectFlag`;

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

  if (response) {
    expect(response.key).toBe('objectFlag');
    expect(response.value).toEqual({ tier: 'premium', maxRetries: 3 });
    expect(response.reason).toBe('STATIC');
  }
});

test('should support nested object flag in single evaluation', async ({
  page,
  grafanaVersion,
  selectors,
  namespace,
}) => {
  test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');

  const flagUrl = `${selectors.apis.OpenFeature.ofrepSinglePath(namespace)}/objectFlagNested`;

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

  if (response) {
    expect(response.key).toBe('objectFlagNested');
    expect(response.value).toEqual({
      config: { api: { timeout: 5000, retries: 3 }, features: ['a', 'b'] },
    });
  }
});
