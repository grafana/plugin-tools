import { describe, expect, it } from 'vitest';
import { mergeConfig } from './config.js';
import { sanitizeForRecording } from './pipeline.js';
import { FakeValueStore, SecretScrubber } from './redact.js';
import type { CapturedRequest, CapturedResponse } from './types.js';

function req(overrides: Partial<CapturedRequest> = {}): CapturedRequest {
  return {
    method: 'GET',
    url: 'https://api.example.com/v1/query',
    headers: { authorization: 'Bearer real-access-key', 'content-type': 'application/json' },
    body: Buffer.from(''),
    ...overrides,
  };
}

function res(body: string, headers: Record<string, string> = { 'content-type': 'application/json' }): CapturedResponse {
  return { status: 200, statusText: 'OK', headers, body: Buffer.from(body) };
}

describe('sanitizeForRecording', () => {
  it('drops request headers not in keepHeaders', () => {
    const config = mergeConfig({ keepHeaders: ['content-type'] });
    const { req: sanitized } = sanitizeForRecording(
      req(),
      res('{}'),
      config,
      new SecretScrubber({}),
      new FakeValueStore(),
      {}
    );
    expect(sanitized.headers).not.toHaveProperty('authorization');
    expect(sanitized.headers).toHaveProperty('content-type');
  });

  it('scrubs a known secret out of a request header that was kept', () => {
    const config = mergeConfig({ keepHeaders: ['authorization'] });
    const scrubber = new SecretScrubber({ ACCESS_KEY: 'real-access-key' });
    const { req: sanitized } = sanitizeForRecording(req(), res('{}'), config, scrubber, new FakeValueStore(), {});
    expect(sanitized.headers.authorization).toBe('Bearer REDACTED');
  });

  it('scrubs a known secret out of the request body', () => {
    const config = mergeConfig({});
    const scrubber = new SecretScrubber({ ACCESS_KEY: 'real-access-key' });
    const body = Buffer.from(JSON.stringify({ token: 'real-access-key' }));
    const { req: sanitized } = sanitizeForRecording(
      req({ body }),
      res('{}'),
      config,
      scrubber,
      new FakeValueStore(),
      {}
    );
    expect(sanitized.body.toString()).not.toContain('real-access-key');
  });

  it('applies redactFields to the response body', () => {
    const config = mergeConfig({ redactFields: ['password'] });
    const response = res(JSON.stringify({ user: { password: 'hunter2' } }));
    const { res: sanitized } = sanitizeForRecording(
      req(),
      response,
      config,
      new SecretScrubber({}),
      new FakeValueStore(),
      {}
    );
    expect(JSON.parse(sanitized.body.toString())).toEqual({ user: { password: 'REDACTED' } });
  });

  it('applies fakeFields with a stable value across the run', () => {
    const config = mergeConfig({ fakeFields: { email: 'email' } });
    const store = new FakeValueStore();
    const responseA = res(JSON.stringify({ email: 'real@example.com' }));
    const responseB = res(JSON.stringify({ email: 'real@example.com' }));
    const { res: sanitizedA } = sanitizeForRecording(req(), responseA, config, new SecretScrubber({}), store, {});
    const { res: sanitizedB } = sanitizeForRecording(req(), responseB, config, new SecretScrubber({}), store, {});
    const emailA = JSON.parse(sanitizedA.body.toString()).email;
    const emailB = JSON.parse(sanitizedB.body.toString()).email;
    expect(emailA).toBe(emailB);
    expect(emailA).not.toBe('real@example.com');
  });

  it('learns a token issued in this response and scrubs it out of the very same response', () => {
    const config = mergeConfig({ learnSecretFields: ['access_token'] });
    const response = res(JSON.stringify({ access_token: 'brand-new-issued-token', token_type: 'Bearer' }));
    const scrubber = new SecretScrubber({});
    const { res: sanitized } = sanitizeForRecording(req(), response, config, scrubber, new FakeValueStore(), {});
    expect(sanitized.body.toString()).not.toContain('brand-new-issued-token');
  });

  it('a token learned from one response is scrubbed from a later response too', () => {
    const config = mergeConfig({ learnSecretFields: ['access_token'] });
    const scrubber = new SecretScrubber({});
    const tokenResponse = res(JSON.stringify({ access_token: 'brand-new-issued-token' }));
    sanitizeForRecording(req(), tokenResponse, config, scrubber, new FakeValueStore(), {});

    const laterRequest = req({ headers: { authorization: 'Bearer brand-new-issued-token' } });
    const laterConfig = mergeConfig({ ...config, keepHeaders: ['authorization'] });
    const { req: sanitizedLater } = sanitizeForRecording(
      laterRequest,
      res('{}'),
      laterConfig,
      scrubber,
      new FakeValueStore(),
      {}
    );
    expect(sanitizedLater.headers.authorization).toBe('Bearer REDACTED');
  });
});
