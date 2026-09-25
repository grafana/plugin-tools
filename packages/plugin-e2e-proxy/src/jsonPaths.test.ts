import { describe, expect, it } from 'vitest';
import { matchesFieldPattern, walkFields } from './jsonPaths.js';

describe('walkFields', () => {
  it('collects leaf values with dotted paths and pattern paths with [*] for arrays', () => {
    const fields = walkFields({
      items: [{ author: { email: 'a@example.com' } }, { author: { email: 'b@example.com' } }],
    });

    expect(fields).toEqual([
      { path: 'items.0.author.email', patternPath: 'items.[*].author.email', value: 'a@example.com' },
      { path: 'items.1.author.email', patternPath: 'items.[*].author.email', value: 'b@example.com' },
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
