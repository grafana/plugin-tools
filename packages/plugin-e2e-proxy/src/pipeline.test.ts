import { describe, expect, it } from 'vitest';
import { mergeConfig } from './config.js';
import { buildMatchKey, matchKeyToString } from './match.js';
import { sanitizeForRecording, sanitizeRequest } from './pipeline.js';
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

describe('sanitizeRequest', () => {
  it('scrubs a known secret from the query string, and redacts credential params by name', () => {
    const config = mergeConfig({});
    const scrubber = new SecretScrubber({ API_KEY: 'real-access-key' });
    const request = req({ url: 'https://api.example.com/v1/q?key=unknown-key&query=up&note=real-access-key' });
    const sanitized = sanitizeRequest(request, config, scrubber, {});
    const params = new URL(sanitized.url).searchParams;
    expect(params.get('key')).toBe('REDACTED');
    expect(params.get('note')).toBe('REDACTED');
    expect(params.get('query')).toBe('up');
  });

  it('always keeps content-type, even when keepHeaders leaves it out', () => {
    const config = mergeConfig({ keepHeaders: ['x-amz-target'] });
    const sanitized = sanitizeRequest(req(), config, new SecretScrubber({}), {});
    expect(sanitized.headers['content-type']).toBe('application/json');
  });

  it('gives a request the same match key whichever value of a provisioned secret it carries', () => {
    const config = mergeConfig({});
    const recorded = req({ method: 'POST', body: Buffer.from(JSON.stringify({ client_secret: 'real-secret-value' })) });
    const live = req({ method: 'POST', body: Buffer.from(JSON.stringify({ client_secret: 'dummy-ci-value' })) });
    const recordedKey = buildMatchKey(
      sanitizeRequest(recorded, config, new SecretScrubber({ S: 'real-secret-value' }), {}),
      config
    );
    const liveKey = buildMatchKey(
      sanitizeRequest(live, config, new SecretScrubber({ S: 'dummy-ci-value' }), {}),
      config
    );
    expect(matchKeyToString(liveKey)).toBe(matchKeyToString(recordedKey));
  });
});

describe('sanitizeForRecording response bodies', () => {
  it('keeps the original bytes when no rule applies', () => {
    const original = '{ "id": 12345678901234567890, "f": 1.0 }';
    const { res: sanitized } = sanitizeForRecording(
      req(),
      res(original),
      mergeConfig({}),
      new SecretScrubber({}),
      new FakeValueStore(),
      {}
    );
    expect(sanitized.body.toString()).toBe(original);
  });

  it('keeps big integers exact when a rule does rewrite the body', () => {
    const config = mergeConfig({ redactFields: ['password'] });
    const response = res('{"id":12345678901234567890,"password":"x"}');
    const { res: sanitized } = sanitizeForRecording(
      req(),
      response,
      config,
      new SecretScrubber({}),
      new FakeValueStore(),
      {}
    );
    expect(sanitized.body.toString()).toBe('{"id":12345678901234567890,"password":"REDACTED"}');
  });

  it('redacts AWS JSON-protocol responses (application/x-amz-json-1.1)', () => {
    const config = mergeConfig({ redactFields: ['SecretAccessKey'] });
    const response = res('{"SecretAccessKey":"abc"}', { 'content-type': 'application/x-amz-json-1.1' });
    const { res: sanitized } = sanitizeForRecording(
      req(),
      response,
      config,
      new SecretScrubber({}),
      new FakeValueStore(),
      {}
    );
    expect(sanitized.body.toString()).toBe('{"SecretAccessKey":"REDACTED"}');
  });

  it('leaves a binary body byte-for-byte intact', () => {
    const binary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0xff, 0xfe, 0x00]);
    const response = { status: 200, statusText: 'OK', headers: { 'content-type': 'image/png' }, body: binary };
    const { res: sanitized } = sanitizeForRecording(
      req(),
      response,
      mergeConfig({}),
      new SecretScrubber({}),
      new FakeValueStore(),
      {}
    );
    expect(sanitized.body.equals(binary)).toBe(true);
  });
});
