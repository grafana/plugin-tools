import { beforeEach, describe, expect, it, vi } from 'vitest';

// identity resolveSelectors so we can assert which tree flowed through; tagged bundled data so we
// can tell the vendored selectors apart from the fetched, reconstructed data
vi.mock('../selectors/vendored', () => ({
  resolveSelectors: vi.fn((versioned: unknown) => versioned),
  versionedComponents: { __source: 'dep-components' },
  versionedPages: { __source: 'dep-pages' },
}));
vi.mock('../selectors/versionedConstants', () => ({ versionedConstants: { __source: 'local-constants' } }));
vi.mock('../selectors/versionedAPIs', () => ({ versionedAPIs: { __source: 'local-apis' } }));

import { selectors } from './selectors';

const VALID_BODY = JSON.stringify({
  schemaVersion: 1,
  versionedComponents: { __source: 'fetched-components' },
  versionedPages: { __source: 'fetched-pages' },
});

function mockResponse({ status = 200, body = '' }: { status?: number; body?: string }) {
  return { status: () => status, ok: () => status >= 200 && status < 300, text: async () => body };
}

function mockRequest(get: ReturnType<typeof vi.fn>) {
  return { get } as never;
}

// URL the bootData fixture would derive from the instance's asset base (origin in single-binary)
const SELECTORS_URL = 'http://grafana.test/public/build/e2e-selectors.json';

async function runFixture(args: { grafanaVersion: string; request: never; selectorsUrl?: string | undefined }) {
  const { grafanaVersion, request } = args;
  // key-presence, not a default, so an explicit `selectorsUrl: undefined` is honored
  const selectorsUrl = 'selectorsUrl' in args ? args.selectorsUrl : SELECTORS_URL;
  let captured: Record<string, unknown> | undefined;
  await (selectors as unknown as (a: unknown, use: (value: Record<string, unknown>) => Promise<void>) => Promise<void>)(
    { grafanaVersion, request, bootData: { version: grafanaVersion, namespace: 'default', selectorsUrl } },
    async (value) => {
      captured = value;
    }
  );
  return captured!;
}

describe('selectors fixture', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    warnSpy.mockClear();
    errorSpy.mockClear();
  });

  it('uses the runtime selectors served by Grafana when present', async () => {
    const get = vi.fn().mockResolvedValue(mockResponse({ status: 200, body: VALID_BODY }));

    const result = await runFixture({ grafanaVersion: '13.4.0-200', request: mockRequest(get) });

    expect(get).toHaveBeenCalledWith(SELECTORS_URL, { maxRedirects: 0 });
    expect(result.components).toEqual({ __source: 'fetched-components' });
    expect(result.pages).toEqual({ __source: 'fetched-pages' });
    expect(result.apis).toEqual({ __source: 'local-apis' });
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('skips the fetch and uses the vendored selectors quietly on Grafana older than 13.3.0', async () => {
    const get = vi.fn();

    const result = await runFixture({ grafanaVersion: '13.2.2', request: mockRequest(get) });

    expect(get).not.toHaveBeenCalled();
    expect(result.components).toEqual({ __source: 'dep-components' });
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('skips the fetch on a non-semver Grafana version', async () => {
    const get = vi.fn();

    const result = await runFixture({ grafanaVersion: 'latest', request: mockRequest(get) });

    expect(get).not.toHaveBeenCalled();
    expect(result.components).toEqual({ __source: 'dep-components' });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('fetches on a 13.3.0 dev build even though it sorts below 13.3.0', async () => {
    const get = vi.fn().mockResolvedValue(mockResponse({ status: 200, body: VALID_BODY }));

    const result = await runFixture({ grafanaVersion: '13.3.0-24547284055', request: mockRequest(get) });

    expect(get).toHaveBeenCalledWith(SELECTORS_URL, { maxRedirects: 0 });
    expect(result.components).toEqual({ __source: 'fetched-components' });
  });

  it('falls back loudly when a Grafana that should serve the file returns 404', async () => {
    const get = vi.fn().mockResolvedValue(mockResponse({ status: 404 }));

    const result = await runFixture({ grafanaVersion: '13.4.0-sup404', request: mockRequest(get) });

    expect(result.components).toEqual({ __source: 'dep-components' });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('falls back loudly when the URL cannot be derived on a supported Grafana', async () => {
    const get = vi.fn();

    const result = await runFixture({
      grafanaVersion: '13.4.0-supnourl',
      request: mockRequest(get),
      selectorsUrl: undefined,
    });

    expect(get).not.toHaveBeenCalled();
    expect(result.components).toEqual({ __source: 'dep-components' });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('falls back loudly on a server error', async () => {
    const get = vi.fn().mockResolvedValue(mockResponse({ status: 503 }));

    const result = await runFixture({ grafanaVersion: '13.4.0-503', request: mockRequest(get) });

    expect(result.components).toEqual({ __source: 'dep-components' });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('falls back loudly on a network error', async () => {
    const get = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await runFixture({ grafanaVersion: '13.4.0-net', request: mockRequest(get) });

    expect(result.components).toEqual({ __source: 'dep-components' });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('falls back loudly on invalid JSON', async () => {
    const get = vi.fn().mockResolvedValue(mockResponse({ status: 200, body: 'not json' }));

    const result = await runFixture({ grafanaVersion: '13.4.0-badjson', request: mockRequest(get) });

    expect(result.components).toEqual({ __source: 'dep-components' });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('falls back loudly on an unexpected schema', async () => {
    const body = JSON.stringify({ schemaVersion: 2, versionedComponents: {}, versionedPages: {} });
    const get = vi.fn().mockResolvedValue(mockResponse({ status: 200, body }));

    const result = await runFixture({ grafanaVersion: '13.4.0-badschema', request: mockRequest(get) });

    expect(result.components).toEqual({ __source: 'dep-components' });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('shares a single fetch across concurrent fixtures for the same version', async () => {
    const get = vi.fn().mockResolvedValue(mockResponse({ status: 200, body: VALID_BODY }));
    const request = mockRequest(get);

    const [a, b] = await Promise.all([
      runFixture({ grafanaVersion: '13.4.0-cache', request }),
      runFixture({ grafanaVersion: '13.4.0-cache', request }),
    ]);

    expect(get).toHaveBeenCalledTimes(1);
    expect(a.components).toEqual({ __source: 'fetched-components' });
    expect(b.components).toEqual({ __source: 'fetched-components' });
  });
});
