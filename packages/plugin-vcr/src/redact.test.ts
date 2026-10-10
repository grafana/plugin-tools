import { describe, expect, it } from 'vitest';
import { applyRedactionRules, FakeValueStore, SecretScrubber } from './redact.js';
import type { JsonNode } from './jsonPaths.js';

/** Test helper: applies only redactFields, discarding the "did anything change" flag the pipeline needs. */
function redactFields(json: JsonNode, fields: string[]): JsonNode {
  return applyRedactionRules(json, fields, {}, new FakeValueStore()).json;
}

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

describe('redactFields', () => {
  it('replaces every matching field, at any depth, with REDACTED', () => {
    const json = { user: { password: 'hunter2' }, items: [{ password: 'x' }, { password: 'y' }] };
    const result = redactFields(json, ['password']);
    expect(result).toEqual({
      user: { password: 'REDACTED' },
      items: [{ password: 'REDACTED' }, { password: 'REDACTED' }],
    });
  });

  it('leaves fields that do not match untouched', () => {
    const json = { user: { name: 'Ada' } };
    expect(redactFields(json, ['password'])).toEqual({ user: { name: 'Ada' } });
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

describe('fakeFields', () => {
  it('replaces matching fields with a stable fake and keeps cross-entry consistency', () => {
    const store = new FakeValueStore();
    const json = {
      items: [{ author: { email: 'a@example.com' } }, { author: { email: 'a@example.com' } }],
    };
    const result = applyRedactionRules(json, [], { '$.items[*].author.email': 'email' }, store).json as {
      items: Array<{ author: { email: string } }>;
    };
    expect(result.items[0].author.email).toBe(result.items[1].author.email);
    expect(result.items[0].author.email).not.toBe('a@example.com');
  });
});

describe('SecretScrubber encodings', () => {
  it('scrubs a password inside a Basic auth token, where base64 covers "user:password"', () => {
    const scrubber = new SecretScrubber({ DB_PASSWORD: 'supersecretpw' });
    const header = `Basic ${Buffer.from('admin:supersecretpw').toString('base64')}`;
    expect(scrubber.scrub(header, {})).toBe('Basic REDACTED');
  });

  it("scrubs Go's form and query encoding, which differs from encodeURIComponent", () => {
    const scrubber = new SecretScrubber({ CLIENT_SECRET: 's3cret value!' });
    expect(scrubber.scrub('client_secret=s3cret+value%21', {})).toBe('client_secret=REDACTED');
  });

  it("scrubs Go's JSON escaping of & < >", () => {
    const scrubber = new SecretScrubber({ API_KEY: 'a&b<c>d-key' });
    expect(scrubber.scrub('{"key":"a\\u0026b\\u003cc\\u003ed-key"}', {})).toBe('{"key":"REDACTED"}');
  });

  it('counts matches by env var name, never by the secret value', () => {
    const scrubber = new SecretScrubber({ API_KEY: 'sekret-value-123' });
    const counts: Record<string, number> = {};
    scrubber.scrub('sekret-value-123 and sekret-value-123', counts);
    expect(counts).toEqual({ API_KEY: 2 });
  });
});

describe('array element patterns', () => {
  it('redacts array elements matched by a [*] pattern', () => {
    const json = { emails: ['alice@corp.com', 'bob@corp.com'] };
    expect(redactFields(json, ['$.emails[*]'])).toEqual({ emails: ['REDACTED', 'REDACTED'] });
  });

  it('reports no change when no rule matches, so the caller can keep the original bytes', () => {
    const result = applyRedactionRules({ a: 1 }, ['password'], {}, new FakeValueStore());
    expect(result.changed).toBe(false);
  });

  it('keeps a "__proto__" key as data instead of setting the prototype', () => {
    const json = JSON.parse('{"__proto__":{"polluted":true},"password":"x"}');
    const result = redactFields(json, ['password']) as Record<string, unknown>;
    expect(Object.keys(result)).toEqual(['__proto__', 'password']);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
