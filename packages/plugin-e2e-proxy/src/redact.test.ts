import { describe, expect, it } from 'vitest';
import { applyFakeFields, applyFieldRedaction, FakeValueStore, SecretScrubber } from './redact.js';

describe('SecretScrubber', () => {
  it('scrubs a known secret value out of arbitrary text', () => {
    const scrubber = new SecretScrubber({ ACCESS_KEY: 'sekret-value-123' });
    const counts: Record<string, number> = {};
    const result = scrubber.scrub('Authorization: Basic sekret-value-123', counts);
    expect(result).not.toContain('sekret-value-123');
    expect(result).toContain('REDACTED');
  });

  it('also scrubs base64 and URL-encoded forms of the same value', () => {
    const scrubber = new SecretScrubber({ SECRET: 'p@ss word/value' });
    const base64 = Buffer.from('p@ss word/value', 'utf8').toString('base64');
    const urlEncoded = encodeURIComponent('p@ss word/value');
    const counts: Record<string, number> = {};
    expect(scrubber.scrub(base64, counts)).toBe('REDACTED');
    expect(scrubber.scrub(urlEncoded, counts)).toBe('REDACTED');
  });

  it('learns a secret from a response field and scrubs it afterwards', () => {
    const scrubber = new SecretScrubber({});
    scrubber.learnFromJson({ access_token: 'issued-token-value' }, ['access_token']);
    const counts: Record<string, number> = {};
    expect(scrubber.scrub('bearer issued-token-value', counts)).toBe('bearer REDACTED');
  });

  it('does not learn short values, to avoid over-redacting common words', () => {
    const scrubber = new SecretScrubber({});
    scrubber.learnFromJson({ access_token: 'ok' }, ['access_token']);
    const counts: Record<string, number> = {};
    expect(scrubber.scrub('the token is ok', counts)).toBe('the token is ok');
  });

  it('a longer secret value is not masked by a shorter one that is its substring', () => {
    const scrubber = new SecretScrubber({ A: 'short-secret', B: 'a-short-secret-that-is-longer' });
    const counts: Record<string, number> = {};
    const result = scrubber.scrub('token=a-short-secret-that-is-longer', counts);
    expect(result).toBe('token=REDACTED');
  });
});

describe('applyFieldRedaction', () => {
  it('replaces every matching field, at any depth, with REDACTED', () => {
    const json = { user: { password: 'hunter2' }, items: [{ password: 'x' }, { password: 'y' }] };
    const result = applyFieldRedaction(json, ['password']);
    expect(result).toEqual({
      user: { password: 'REDACTED' },
      items: [{ password: 'REDACTED' }, { password: 'REDACTED' }],
    });
  });

  it('leaves fields that do not match untouched', () => {
    const json = { user: { name: 'Ada' } };
    expect(applyFieldRedaction(json, ['password'])).toEqual({ user: { name: 'Ada' } });
  });
});

describe('FakeValueStore', () => {
  it('maps the same real value to the same fake value', () => {
    const store = new FakeValueStore();
    const first = store.fakeFor('email', 'real@example.com');
    const second = store.fakeFor('email', 'real@example.com');
    expect(first).toBe(second);
  });

  it('gives different real values different fakes', () => {
    const store = new FakeValueStore();
    expect(store.fakeFor('email', 'a@example.com')).not.toBe(store.fakeFor('email', 'b@example.com'));
  });
});

describe('applyFakeFields', () => {
  it('replaces matching fields with a stable fake and keeps cross-entry consistency', () => {
    const store = new FakeValueStore();
    const json = {
      items: [{ author: { email: 'a@example.com' } }, { author: { email: 'a@example.com' } }],
    };
    const result = applyFakeFields(json, { '$.items[*].author.email': 'email' }, store) as {
      items: Array<{ author: { email: string } }>;
    };
    expect(result.items[0].author.email).toBe(result.items[1].author.email);
    expect(result.items[0].author.email).not.toBe('a@example.com');
  });
});
