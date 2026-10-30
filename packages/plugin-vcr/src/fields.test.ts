import { describe, expect, it } from 'vitest';
import { emptyHar, toHarEntry } from './har.js';
import { summarizeFields } from './fields.js';
import { applyRedactionRules, FakeValueStore } from './redact.js';
import type { CapturedRequest, CapturedResponse } from './types.js';
import type { JsonNode } from './jsonPaths.js';

function redactFields(json: JsonNode, fields: string[]): JsonNode {
  return applyRedactionRules(json, fields, {}, new FakeValueStore()).json;
}

function req(): CapturedRequest {
  return { method: 'GET', url: 'https://api.example.com/v1/items', headers: {}, body: Buffer.from('') };
}

function res(body: object): CapturedResponse {
  return {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    body: Buffer.from(JSON.stringify(body)),
  };
}

describe('summarizeFields', () => {
  it('collapses array indices into [*] and lists distinct sample values', () => {
    const har = emptyHar();
    har.log.entries.push(
      toHarEntry(
        req(),
        res({ items: [{ author: { email: 'a@example.com' } }, { author: { email: 'b@example.com' } }] }),
        new Date(),
        1
      )
    );

    const fields = summarizeFields(har);
    const emailField = fields.find((f) => f.path === 'items[*].author.email');
    expect(emailField?.samples).toEqual(['a@example.com', 'b@example.com']);
  });

  it('skips non-JSON responses', () => {
    const har = emptyHar();
    const entry = toHarEntry(req(), res({ a: 1 }), new Date(), 1);
    entry.response.content.mimeType = 'text/plain';
    har.log.entries.push(entry);
    expect(summarizeFields(har)).toEqual([]);
  });

  it('caps the number of samples per field', () => {
    const har = emptyHar();
    for (let i = 0; i < 10; i++) {
      har.log.entries.push(toHarEntry(req(), res({ id: `id-${i}` }), new Date(), 1));
    }
    const fields = summarizeFields(har);
    expect(fields.find((f) => f.path === 'id')?.samples).toHaveLength(3);
  });
});

describe('summarizeFields output as redaction rules', () => {
  it('prints paths that work as redactFields patterns when pasted as-is', () => {
    const body = { items: [{ author: { email: 'a@example.com', tags: ['x'] } }], total: 1 };
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res(body), new Date(), 1));

    for (const { path } of summarizeFields(har)) {
      const redacted = JSON.stringify(redactFields(body, [path]));
      expect(redacted, `pattern "${path}" should redact something`).toContain('REDACTED');
    }
  });
});

describe('summarizeFields with JSON held in a string value', () => {
  it('lists the embedded fields, e.g. SecretString.password, so they can be reviewed', () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res({ SecretString: JSON.stringify({ password: 'x' }) }), new Date(), 1));
    expect(summarizeFields(har).map((f) => f.path)).toContain('SecretString.password');
  });
});
