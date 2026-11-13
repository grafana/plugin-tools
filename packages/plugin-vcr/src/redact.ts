import type { FakeKind } from './types.js';
import {
  childIndexPath,
  childKeyPath,
  isJsonObject,
  matchesFieldPattern,
  parseEmbeddedJson,
  walkFields,
  type JsonNode,
} from './jsonPaths.js';

/** Minimum length for a learned secret, so a short common word issued as a token doesn't get redacted everywhere. */
const MIN_LEARNED_SECRET_LENGTH = 8;
/** Minimum length for a known secret. Shorter values would wreck unrelated text and aren't realistic credentials. */
const MIN_KNOWN_SECRET_LENGTH = 4;
/** Base64 runs at least this long are decoded to look for an embedded secret, e.g. `Basic base64(user:password)`. */
const EMBEDDED_BASE64_RE = /[A-Za-z0-9+/_-]{12,}={0,2}/g;

const LEARNED_LABEL = 'learned';

/**
 * Tracks every value known or discovered to be a secret, and scrubs them out of anything written
 * to disk. A value is matched raw and in each encoding a client is likely to put it on the wire:
 * base64, URL, form and Go query encoding, JSON escaping, and inside a larger base64 token such as
 * `Authorization: Basic base64(user:password)`.
 *
 * Counts are keyed by a label (the env var name, or "learned"), never by the secret itself.
 */
export class SecretScrubber {
  private readonly labels = new Map<string, string>();
  private variants: Array<{ text: string; label: string }> = [];

  constructor(knownSecrets: Record<string, string>) {
    Object.entries(knownSecrets).forEach(([name, value]) => this.add(value, name, MIN_KNOWN_SECRET_LENGTH));
  }

  add(value: string, label = LEARNED_LABEL, minLength = MIN_KNOWN_SECRET_LENGTH): void {
    if (!value || value.length < minLength || value === 'REDACTED' || this.labels.has(value)) {
      return;
    }
    this.labels.set(value, label);
    const forms = new Set(encodedForms(value));
    for (const text of forms) {
      this.variants.push({ text, label });
    }
    // longest first, so a shorter secret that's a substring of a longer one doesn't leave the rest behind
    this.variants.sort((a, b) => b.text.length - a.text.length);
  }

  /** Scans a parsed JSON response for fields named in `learnSecretFields` and adds their values. */
  learnFromJson(json: JsonNode, learnSecretFields: string[]): void {
    if (learnSecretFields.length === 0) {
      return;
    }
    for (const field of walkFields(json)) {
      if (
        typeof field.value === 'string' &&
        learnSecretFields.some((pattern) => matchesFieldPattern(field.patternPath, pattern))
      ) {
        this.add(field.value, LEARNED_LABEL, MIN_LEARNED_SECRET_LENGTH);
      }
    }
  }

  /** Replaces every known secret occurrence in `text` with `REDACTED`, counting matches per label. */
  scrub(text: string, counts: Record<string, number>): string {
    if (this.variants.length === 0 || text.length === 0) {
      return text;
    }
    // whole base64 tokens first, otherwise a variant can replace just the aligned tail of one
    let result = text.replace(EMBEDDED_BASE64_RE, (run) => {
      const label = this.labelOfEmbeddedSecret(run);
      if (!label) {
        return run;
      }
      counts[label] = (counts[label] ?? 0) + 1;
      return 'REDACTED';
    });
    for (const { text: variant, label } of this.variants) {
      const parts = result.split(variant);
      if (parts.length > 1) {
        counts[label] = (counts[label] ?? 0) + parts.length - 1;
        result = parts.join('REDACTED');
      }
    }
    return result;
  }

  private labelOfEmbeddedSecret(run: string): string | undefined {
    const decoded = Buffer.from(run, 'base64').toString('utf8');
    for (const [value, label] of this.labels) {
      if (decoded.includes(value)) {
        return label;
      }
    }
    return undefined;
  }
}

function encodedForms(value: string): string[] {
  const bytes = Buffer.from(value, 'utf8');
  const jsonEscaped = JSON.stringify(value).slice(1, -1);
  return [
    value,
    bytes.toString('base64'),
    bytes.toString('base64url'),
    encodeURIComponent(value),
    new URLSearchParams({ v: value }).toString().slice('v='.length),
    goQueryEscape(bytes),
    jsonEscaped,
    // Go's encoding/json also escapes these for safe embedding in HTML
    jsonEscaped
      .replace(/&/g, '\\u0026')
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029'),
  ];
}

/** Go's url.QueryEscape, which differs from encodeURIComponent for space and !*'() */
function goQueryEscape(bytes: Buffer): string {
  let out = '';
  for (const byte of bytes) {
    const char = String.fromCharCode(byte);
    if (/[A-Za-z0-9\-_.~]/.test(char)) {
      out += char;
    } else if (char === ' ') {
      out += '+';
    } else {
      out += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    }
  }
  return out;
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

/**
 * Applies `redactFields` then `fakeFields` to a parsed JSON document. `changed` is false when no
 * rule matched, so the caller can keep the original bytes instead of re-serializing.
 */
export function applyRedactionRules(
  json: JsonNode,
  redactFields: string[],
  fakeFields: Record<string, FakeKind>,
  store: FakeValueStore
): { json: JsonNode; changed: boolean } {
  const redacted = transformMatchingFields(json, redactFields, () => 'REDACTED');
  const faked = transformMatchingFields(redacted.json, Object.keys(fakeFields), (value, pattern) =>
    typeof value === 'string' ? store.fakeFor(fakeFields[pattern], value) : value
  );
  return { json: faked.json, changed: redacted.changed || faked.changed };
}

/**
 * Replaces every object value or array element whose path matches a pattern, including fields of
 * JSON held in a string value (re-encoded afterwards only if something changed). Doesn't mutate `json`.
 */
function transformMatchingFields(
  json: JsonNode,
  patterns: string[],
  transform: (value: JsonNode, matchedPattern: string) => JsonNode
): { json: JsonNode; changed: boolean } {
  if (patterns.length === 0) {
    return { json, changed: false };
  }
  let changed = false;

  const visitChild = (node: JsonNode, patternPath: string): JsonNode => {
    const matched = patterns.find((pattern) => matchesFieldPattern(patternPath, pattern));
    if (!matched) {
      return walk(node, patternPath);
    }
    const replaced = transform(node, matched);
    changed ||= replaced !== node;
    return replaced;
  };

  const walk = (node: JsonNode, patternPath: string): JsonNode => {
    if (Array.isArray(node)) {
      return node.map((item) => visitChild(item, childIndexPath(patternPath)));
    }
    if (isJsonObject(node)) {
      // fromEntries defines own properties, so a "__proto__" key stays data instead of setting the prototype
      return Object.fromEntries(
        Object.entries(node).map(([key, value]) => [key, visitChild(value, childKeyPath(patternPath, key))])
      );
    }
    const embedded = typeof node === 'string' ? parseEmbeddedJson(node) : undefined;
    if (embedded !== undefined) {
      const changedBefore = changed;
      changed = false;
      const transformed = walk(embedded, patternPath);
      const embeddedChanged = changed;
      changed = changedBefore || embeddedChanged;
      return embeddedChanged ? JSON.stringify(transformed) : node;
    }
    return node;
  };

  return { json: walk(json, ''), changed };
}
