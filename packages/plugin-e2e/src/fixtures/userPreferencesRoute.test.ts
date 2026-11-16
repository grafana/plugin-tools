import type { Route } from '@playwright/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleMergedPreferencesRoute } from './userPreferencesRoute';

function createRoute(overrides: { fetch?: () => Promise<unknown> } = {}) {
  const response = {
    ok: () => true,
    json: vi.fn().mockResolvedValue({ spec: { theme: 'dark', language: 'en' } }),
  };
  return {
    response,
    route: {
      fetch: vi.fn(overrides.fetch ?? (() => Promise.resolve(response))),
      fulfill: vi.fn().mockResolvedValue(undefined),
    } as unknown as Route,
  };
}

describe('handleMergedPreferencesRoute', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('merges user preferences into the response spec', async () => {
    const { route, response } = createRoute();

    await handleMergedPreferencesRoute(route, { theme: 'light' });

    expect(route.fulfill).toHaveBeenCalledWith({
      response,
      json: { spec: { theme: 'light', language: 'en' } },
    });
  });

  it('passes a failed response through untouched', async () => {
    const response = { ok: () => false, json: vi.fn() };
    const { route } = createRoute({ fetch: () => Promise.resolve(response) });

    await handleMergedPreferencesRoute(route, { theme: 'light' });

    expect(response.json).not.toHaveBeenCalled();
    expect(route.fulfill).toHaveBeenCalledWith({ response });
  });

  it.each([
    'route.fetch: Target page, context or browser has been closed',
    'apiResponse.json: Response has been disposed',
  ])('ignores teardown errors: %s', async (message) => {
    const { route } = createRoute({ fetch: () => Promise.reject(new Error(message)) });

    await handleMergedPreferencesRoute(route, { theme: 'light' });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(route.fulfill).not.toHaveBeenCalled();
  });

  it('logs one line and fulfills with a 500 when the fetch fails', async () => {
    const { route } = createRoute({
      fetch: () => Promise.reject(new Error('route.fetch: connect ECONNREFUSED\nCall log:\n  - GET http://x')),
    });

    await handleMergedPreferencesRoute(route, { theme: 'light' });

    expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
      '@grafana/plugin-e2e: Failed to intercept merged preferences: route.fetch: connect ECONNREFUSED'
    );
    expect(route.fulfill).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }));
  });

  it('fulfills with the fetched response when the body cannot be parsed', async () => {
    const response = { ok: () => true, json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token <')) };
    const { route } = createRoute({ fetch: () => Promise.resolve(response) });

    await handleMergedPreferencesRoute(route, { theme: 'light' });

    expect(route.fetch).toHaveBeenCalledTimes(1);
    expect(route.fulfill).toHaveBeenCalledExactlyOnceWith({ response });
  });
});
