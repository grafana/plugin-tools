import { describe, expect, it } from 'vitest';
import { mergeConfig } from './config.js';
import { emptyHar, toHarEntry } from './har.js';
import { redactExistingHar } from './offlineRedact.js';
import type { CapturedRequest, CapturedResponse } from './types.js';

function req(): CapturedRequest {
  return {
    method: 'GET',
    url: 'https://api.example.com/v1/items',
    headers: { authorization: 'Bearer x' },
    body: Buffer.from(''),
  };
}

function res(body: object): CapturedResponse {
  return {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    body: Buffer.from(JSON.stringify(body)),
  };
}

describe('redactExistingHar', () => {
  it('applies a newly added redactFields rule to an already-recorded entry, without touching timing', () => {
    const har = emptyHar();
    har.log.entries.push(
      toHarEntry(req(), res({ user: { email: 'real@example.com' } }), new Date('2026-01-01T00:00:00.000Z'), 42)
    );

    const config = mergeConfig({ redactFields: ['email'] });
    const result = redactExistingHar(har, config, {});

    expect(JSON.parse(result.log.entries[0].response.content.text)).toEqual({ user: { email: 'REDACTED' } });
    expect(result.log.entries[0].startedDateTime).toBe('2026-01-01T00:00:00.000Z');
    expect(result.log.entries[0].time).toBe(42);
  });

  it('re-scrubs a known secret that was missed the first time', () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res({ echo: 'leaked-secret-value' }), new Date(), 1));

    const config = mergeConfig({ keepResponseHeaders: ['content-type'] });
    const result = redactExistingHar(har, config, { API_KEY: 'leaked-secret-value' });

    expect(result.log.entries[0].response.content.text).not.toContain('leaked-secret-value');
  });
});
