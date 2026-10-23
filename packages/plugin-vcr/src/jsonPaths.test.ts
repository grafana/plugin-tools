import { describe, expect, it } from 'vitest';
import { matchesFieldPattern, parseJsonLossless, walkFields } from './jsonPaths.js';

describe('walkFields', () => {
  it('collects leaf values with dotted paths and pattern paths with [*] for arrays', () => {
    const fields = walkFields({
      items: [{ author: { email: 'a@example.com' } }, { author: { email: 'b@example.com' } }],
    });

    expect(fields).toEqual([
      { path: 'items.0.author.email', patternPath: 'items[*].author.email', value: 'a@example.com' },
      { path: 'items.1.author.email', patternPath: 'items[*].author.email', value: 'b@example.com' },
    ]);
  });
});

describe('matchesFieldPattern', () => {
  it('matches a bare field name at any depth', () => {
    expect(matchesFieldPattern('items.[*].author.email', 'email')).toBe(true);
    expect(matchesFieldPattern('password', 'password')).toBe(true);
    expect(matchesFieldPattern('items.[*].author.name', 'email')).toBe(false);
  });

  it('matches a JSONPath-style pattern exactly', () => {
    expect(matchesFieldPattern('items.[*].author.email', '$.items[*].author.email')).toBe(true);
    expect(matchesFieldPattern('items.[*].author.login', '$.items[*].author.email')).toBe(false);
  });
});

describe('walkFields on large documents', () => {
  it('walks a 200k-element array without overflowing the call stack', () => {
    const json = { points: Array.from({ length: 200_000 }, (_, i) => i) };
    expect(walkFields(json)).toHaveLength(200_000);
  });
});

describe('parseJsonLossless', () => {
  it('round-trips integers above 2^53 and number formatting exactly', () => {
    const text = '{"id":12345678901234567890,"f":1.0,"e":1e3}';
    expect(JSON.stringify(parseJsonLossless(text))).toBe(text);
  });
});

describe('matchesFieldPattern path forms', () => {
  it('accepts the form printed by `fields`, with or without a "$." prefix, and the older ".[*]" form', () => {
    expect(matchesFieldPattern('items[*].author.email', 'items[*].author.email')).toBe(true);
    expect(matchesFieldPattern('items[*].author.email', '$.items[*].author.email')).toBe(true);
    expect(matchesFieldPattern('items[*].author.email', 'items.[*].author.email')).toBe(true);
  });

  it('matches array elements', () => {
    expect(matchesFieldPattern('emails[*]', '$.emails[*]')).toBe(true);
    expect(matchesFieldPattern('emails', '$.emails[*]')).toBe(false);
  });
});
