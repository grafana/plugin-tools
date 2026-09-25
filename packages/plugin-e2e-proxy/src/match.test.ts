import { describe, expect, it } from 'vitest';
import { mergeConfig } from './config.js';
import { buildMatchKey, matchKeyToString } from './match.js';
import type { CapturedRequest } from './types.js';

function req(overrides: Partial<CapturedRequest>): CapturedRequest {
  return {
    method: 'POST',
    url: 'https://api.example.com/v1/query?a=1&b=2',
    headers: { 'content-type': 'application/json' },
    body: Buffer.from(''),
    ...overrides,
  };
}

describe('buildMatchKey', () => {
  it('produces the same key regardless of query param order', () => {
    const config = mergeConfig({});
    const a = matchKeyToString(buildMatchKey(req({ url: 'https://api.example.com/v1/query?a=1&b=2' }), config));
    const b = matchKeyToString(buildMatchKey(req({ url: 'https://api.example.com/v1/query?b=2&a=1' }), config));
    expect(a).toBe(b);
  });

  it('ignores query params listed in ignoreQueryParams', () => {
    const config = mergeConfig({ ignoreQueryParams: ['requestId'] });
    const a = matchKeyToString(buildMatchKey(req({ url: 'https://api.example.com/v1/query?requestId=abc' }), config));
    const b = matchKeyToString(buildMatchKey(req({ url: 'https://api.example.com/v1/query?requestId=xyz' }), config));
    expect(a).toBe(b);
  });

  it('ignores JSON body fields listed in ignoreFields, at any depth', () => {
    const config = mergeConfig({ ignoreFields: ['ClientToken'] });
    const bodyA = Buffer.from(JSON.stringify({ query: 'select 1', ClientToken: 'aaaa' }));
    const bodyB = Buffer.from(JSON.stringify({ query: 'select 1', ClientToken: 'bbbb' }));
    const a = matchKeyToString(buildMatchKey(req({ body: bodyA }), config));
    const b = matchKeyToString(buildMatchKey(req({ body: bodyB }), config));
    expect(a).toBe(b);
  });

  it('is not affected by JSON key order', () => {
    const config = mergeConfig({});
    const bodyA = Buffer.from(JSON.stringify({ a: 1, b: 2 }));
    const bodyB = Buffer.from(JSON.stringify({ b: 2, a: 1 }));
    const a = matchKeyToString(buildMatchKey(req({ body: bodyA }), config));
    const b = matchKeyToString(buildMatchKey(req({ body: bodyB }), config));
    expect(a).toBe(b);
  });

  it('differs when a non-ignored field changes', () => {
    const config = mergeConfig({});
    const bodyA = Buffer.from(JSON.stringify({ query: 'select 1' }));
    const bodyB = Buffer.from(JSON.stringify({ query: 'select 2' }));
    const a = matchKeyToString(buildMatchKey(req({ body: bodyA }), config));
    const b = matchKeyToString(buildMatchKey(req({ body: bodyB }), config));
    expect(a).not.toBe(b);
  });

  it('drops the entire body for hosts/paths listed in ignoreBodyFor', () => {
    const config = mergeConfig({ ignoreBodyFor: ['api.example.com/v1/query'] });
    const bodyA = Buffer.from(JSON.stringify({ query: 'select 1' }));
    const bodyB = Buffer.from(JSON.stringify({ query: 'select 2' }));
    const a = matchKeyToString(buildMatchKey(req({ body: bodyA }), config));
    const b = matchKeyToString(buildMatchKey(req({ body: bodyB }), config));
    expect(a).toBe(b);
  });

  it('only compares headers listed in keepHeaders', () => {
    const config = mergeConfig({ keepHeaders: ['content-type'] });
    const a = matchKeyToString(
      buildMatchKey(req({ headers: { 'content-type': 'application/json', authorization: 'Bearer aaa' } }), config)
    );
    const b = matchKeyToString(
      buildMatchKey(req({ headers: { 'content-type': 'application/json', authorization: 'Bearer bbb' } }), config)
    );
    expect(a).toBe(b);
  });
});
