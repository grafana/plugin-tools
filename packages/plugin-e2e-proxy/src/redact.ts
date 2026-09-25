import type { FakeKind } from './types.js';
import { matchesFieldPattern, walkFields, type JsonNode } from './jsonPaths.js';

/** Minimum length a string value must have to be treated as a learnable secret, to avoid redacting short common words. */
const MIN_LEARNED_SECRET_LENGTH = 8;

/**
 * Tracks every value known or discovered to be a secret, and scrubs them out of anything written
 * to disk. Values are matched raw, base64-encoded and URL-encoded, so a token embedded in a
 * `Authorization: Basic ...` header or a redirect URL is caught too.
 */
export class SecretScrubber {
  private readonly values = new Set<string>();
  private encodedVariants: string[] = [];

  constructor(knownSecrets: Record<string, string>) {
    Object.values(knownSecrets).forEach((value) => this.add(value));
  }

  add(value: string): void {
    if (!value || this.values.has(value)) {
      return;
    }
    this.values.add(value);
    this.encodedVariants.push(value, Buffer.from(value, 'utf8').toString('base64'), encodeURIComponent(value));
  }

  /** Scans a parsed JSON response for fields named in `learnSecretFields` and adds their values. */
  learnFromJson(json: JsonNode, learnSecretFields: string[]): void {
    if (learnSecretFields.length === 0) {
      return;
    }
    for (const field of walkFields(json)) {
      if (
        typeof field.value === 'string' &&
        field.value.length >= MIN_LEARNED_SECRET_LENGTH &&
        learnSecretFields.some((pattern) => matchesFieldPattern(field.patternPath, pattern))
      ) {
        this.add(field.value);
      }
    }
  }

  /** Replaces every known secret occurrence in `text` with `REDACTED`, counting matches per original value. */
  scrub(text: string, counts: Record<string, number>): string {
    if (this.encodedVariants.length === 0 || text.length === 0) {
      return text;
    }
    let result = text;
    // longest variants first, so a shorter value that happens to be a substring of a longer one doesn't mask it
    const sorted = [...new Set(this.encodedVariants)].sort((a, b) => b.length - a.length);
    for (const variant of sorted) {
      if (!variant) {
        continue;
      }
      const before = result;
      result = result.split(variant).join('REDACTED');
      if (result !== before) {
        counts[variant] = (counts[variant] ?? 0) + before.split(variant).length - 1;
      }
    }
    return result;
  }
}

/** Sets every field matching `redactFields` to the literal string `REDACTED`. Mutates and returns `json`. */
export function applyFieldRedaction(json: JsonNode, redactFields: string[]): JsonNode {
  return transformMatchingFields(json, redactFields, () => 'REDACTED');
}

/**
 * Stable fake-data store: the same real value always maps to the same fake value within one
 * recording run, so relationships between entries (and test assertions on that data) survive.
 */
export class FakeValueStore {
  private readonly mapping = new Map<string, string>();
  private readonly counters: Record<FakeKind, number> = { email: 0, username: 0, name: 0, ip: 0, string: 0 };

  fakeFor(kind: FakeKind, real: string): string {
    const cacheKey = `${kind}:${real}`;
    const existing = this.mapping.get(cacheKey);
    if (existing) {
      return existing;
    }
    const n = ++this.counters[kind];
    const fake = generateFake(kind, n);
    this.mapping.set(cacheKey, fake);
    return fake;
  }
}

function generateFake(kind: FakeKind, n: number): string {
  switch (kind) {
    case 'email':
      return `user-${n}@example.com`;
    case 'username':
      return `user-${n}`;
    case 'name':
      return `Test Person ${n}`;
    case 'ip':
      return `10.${Math.floor(n / 256) % 256}.${n % 256}.1`;
    case 'string':
    default:
      return `fake-${n}`;
  }
}

export function applyFakeFields(json: JsonNode, fakeFields: Record<string, FakeKind>, store: FakeValueStore): JsonNode {
  const patterns = Object.keys(fakeFields);
  if (patterns.length === 0) {
    return json;
  }
  return transformMatchingFieldsWithPattern(json, patterns, (value, pattern) => {
    if (typeof value !== 'string') {
      return value;
    }
    return store.fakeFor(fakeFields[pattern], value);
  });
}

function transformMatchingFields(
  json: JsonNode,
  patterns: string[],
  transform: (value: JsonNode) => JsonNode
): JsonNode {
  return transformMatchingFieldsWithPattern(json, patterns, transform);
}

function transformMatchingFieldsWithPattern(
  json: JsonNode,
  patterns: string[],
  transform: (value: JsonNode, matchedPattern: string) => JsonNode
): JsonNode {
  if (patterns.length === 0) {
    return json;
  }

  function walk(node: JsonNode, patternSegments: string[]): JsonNode {
    if (Array.isArray(node)) {
      return node.map((item) => walk(item, [...patternSegments, '[*]']));
    }
    if (typeof node === 'object' && node !== null) {
      const result: Record<string, JsonNode> = {};
      for (const [key, value] of Object.entries(node)) {
        const childPatternPath = [...patternSegments, key].join('.');
        const matched = patterns.find((pattern) => matchesFieldPattern(childPatternPath, pattern));
        result[key] = matched ? transform(value, matched) : walk(value, [...patternSegments, key]);
      }
      return result;
    }
    return node;
  }

  return walk(json, []);
}
