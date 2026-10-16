import type { Page, Route } from '@playwright/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlaywrightArgs } from '../types';
import { setupOpenFeatureRoutes } from './openFeature';

const BULK_PATTERN = '**/ofrep/v1/evaluate/flags';
const SINGLE_PATTERN = '**/ofrep/v1/evaluate/flags/*';

const selectors = {
  apis: { OpenFeature: { ofrepBulkPattern: BULK_PATTERN, ofrepSinglePattern: SINGLE_PATTERN } },
} as unknown as PlaywrightArgs['selectors'];

const withCallLog = (message: string) =>
  new Error(
    [
      message,
      'Call log:',
      '  - → POST http://localhost:3000/apis/features.grafana.app/v0alpha1/namespaces/default/ofrep/v1/evaluate/flags',
      '    - user-agent: Mozilla/5.0 (X11; Linux x86_64)',
      '    - accept: */*',
    ].join('\n')
  );

const fetchError = withCallLog('route.fetch: connect ECONNREFUSED 127.0.0.1:3000');

type RouteHandler = (route: Route) => Promise<void>;

async function registerRoutes() {
  const handlers = new Map<string, RouteHandler>();
  const page = {
    route: vi.fn((pattern: string, handler: RouteHandler) => {
      handlers.set(pattern, handler);
      return Promise.resolve();
    }),
  } as unknown as Page;
  await setupOpenFeatureRoutes(page, { someFlag: true }, 0, selectors);
  return handlers;
}

function createFailingRoute(url: string, error: Error = fetchError) {
  return {
    request: () => ({ url: () => url }),
    fetch: vi.fn().mockRejectedValue(error),
    fulfill: vi.fn().mockResolvedValue(undefined),
  } as unknown as Route;
}

describe('setupOpenFeatureRoutes', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('prints one line when the bulk evaluation fetch fails', async () => {
    const handlers = await registerRoutes();
    const route = createFailingRoute('http://localhost:3000/ofrep/v1/evaluate/flags');

    await handlers.get(BULK_PATTERN)?.(route);

    expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
      '@grafana/plugin-e2e: Failed to intercept OFREP bulk evaluation: route.fetch: connect ECONNREFUSED 127.0.0.1:3000'
    );
  });

  it('still fulfills the bulk evaluation request with an error response', async () => {
    const handlers = await registerRoutes();
    const route = createFailingRoute('http://localhost:3000/ofrep/v1/evaluate/flags');

    await handlers.get(BULK_PATTERN)?.(route);

    expect(route.fulfill).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }));
  });

  it('prints one line when the single flag fetch fails', async () => {
    const handlers = await registerRoutes();
    const route = createFailingRoute('http://localhost:3000/ofrep/v1/evaluate/flags/otherFlag');

    await handlers.get(SINGLE_PATTERN)?.(route);

    expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
      '@grafana/plugin-e2e: Failed to intercept OFREP single flag evaluation: route.fetch: connect ECONNREFUSED 127.0.0.1:3000'
    );
    expect(route.fulfill).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }));
  });

  it.each(['route.fetch: Test ended.', 'route.fetch: Test timeout of 30000ms exceeded.'])(
    'stays silent when the test closes the context mid-request (%s)',
    async (message) => {
      const handlers = await registerRoutes();
      const bulk = createFailingRoute('http://localhost:3000/ofrep/v1/evaluate/flags', withCallLog(message));
      const single = createFailingRoute(
        'http://localhost:3000/ofrep/v1/evaluate/flags/otherFlag',
        withCallLog(message)
      );

      await handlers.get(BULK_PATTERN)?.(bulk);
      await handlers.get(SINGLE_PATTERN)?.(single);

      expect(errorSpy).not.toHaveBeenCalled();
    }
  );
});
