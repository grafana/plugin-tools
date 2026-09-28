/**
 * Shared helpers for walking parsed JSON and matching config patterns against its fields. Used by
 * matching (ignoreFields), redaction (redactFields/fakeFields), token learning and `fields`.
 *
 * A field's pattern path joins object keys with "." and marks array elements with "[*]", e.g.
 * "items[*].author.email". A config pattern is either a bare field name ("password", matching that
 * key at any depth) or a path in the same form, optionally prefixed with "$.". The paths printed by
 * the `fields` command can be pasted into proxy.json as they are.
 */

/** A number kept as its original source text, see `parseJsonLossless`. */
export interface RawJson {
  readonly rawJSON: string;
}

export type JsonNode = string | number | boolean | null | RawJson | JsonNode[] | { [key: string]: JsonNode };

interface LosslessJson {
  parse(text: string, reviver: (key: string, value: unknown, context: { source?: string }) => unknown): unknown;
  rawJSON(text: string): RawJson;
  isRawJSON(value: unknown): value is RawJson;
}

const losslessJson = JSON as unknown as LosslessJson;

/**
 * Parses JSON keeping every number as its original text, so serializing it again with
 * `JSON.stringify` never rounds integers above 2^53 or rewrites `1.0` as `1`.
 */
export function parseJsonLossless(text: string): JsonNode {
  return losslessJson.parse(text, (_key, value, context) =>
    typeof value === 'number' && context.source !== undefined ? losslessJson.rawJSON(context.source) : value
  ) as JsonNode;
}

export function isRawJson(node: unknown): node is RawJson {
  return losslessJson.isRawJSON(node);
}

export function isJsonObject(node: JsonNode): node is { [key: string]: JsonNode } {
  return typeof node === 'object' && node !== null && !Array.isArray(node) && !isRawJson(node);
}

/** Covers application/json, AWS's application/x-amz-json-1.1 and vendor types like application/vnd.api+json. */
export function isJsonContentType(contentType: string): boolean {
  return /json/i.test(contentType);
}

/**
 * A string that holds a JSON object or array, such as AWS Secrets Manager's `SecretString`, parsed
 * so its fields can be matched as `SecretString.password`. Undefined for any other string.
 */
export function parseEmbeddedJson(value: string): JsonNode | undefined {
  const trimmed = value.trim();
  if (!(trimmed.startsWith('{') && trimmed.endsWith('}')) && !(trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return undefined;
  }
  try {
    const parsed = parseJsonLossless(trimmed);
    return Array.isArray(parsed) || isJsonObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Text form of a leaf value, with numbers in their original source form. */
export function leafToString(node: JsonNode): string {
  return isRawJson(node) ? node.rawJSON : String(node);
}

export function childKeyPath(parent: string, key: string): string {
  return parent === '' ? key : `${parent}.${key}`;
}

export function childIndexPath(parent: string): string {
  return `${parent}[*]`;
}

export interface FieldMatch {
  /** Dotted path with array indices, e.g. "items.0.author.email". Unique per node in a document. */
  path: string;
  /** Path with array indices collapsed to "[*]", e.g. "items[*].author.email". Used to match config patterns. */
  patternPath: string;
  value: JsonNode;
}

/**
 * Visits every node below the root, depth first, containers included. Results are collected by the
 * caller rather than returned per level, so a huge array doesn't overflow the call stack.
 */
export function visitJson(
  root: JsonNode,
  visit: (match: FieldMatch, isLeaf: boolean) => void,
  { descendIntoJsonStrings = false }: { descendIntoJsonStrings?: boolean } = {}
): void {
  const walk = (node: JsonNode, path: string, patternPath: string): void => {
    if (Array.isArray(node)) {
      if (path !== '') {
        visit({ path, patternPath, value: node }, false);
      }
      node.forEach((item, index) => walk(item, childKeyPath(path, String(index)), childIndexPath(patternPath)));
      return;
    }
    if (isJsonObject(node)) {
      if (path !== '') {
        visit({ path, patternPath, value: node }, false);
      }
      for (const [key, value] of Object.entries(node)) {
        walk(value, childKeyPath(path, key), childKeyPath(patternPath, key));
      }
      return;
    }
    if (path !== '') {
      visit({ path, patternPath, value: node }, true);
    }
    const embedded = descendIntoJsonStrings && typeof node === 'string' ? parseEmbeddedJson(node) : undefined;
    if (embedded !== undefined) {
      walk(embedded, path, patternPath);
    }
  };
  walk(root, '', '');
}

/** Every leaf value in a JSON document, depth first, including the fields of JSON held in string values. */
export function walkFields(root: JsonNode): FieldMatch[] {
  const results: FieldMatch[] = [];
  visitJson(
    root,
    (match, isLeaf) => {
      if (isLeaf) {
        results.push(match);
      }
    },
    { descendIntoJsonStrings: true }
  );
  return results;
}

/** True when a field at `patternPath` (e.g. "items[*].author.email") is selected by a config `pattern`. */
export function matchesFieldPattern(patternPath: string, pattern: string): boolean {
  const normalized = pattern.replace(/^\$\.?/, '').replace(/\.\[\*\]/g, '[*]');
  if (!/[.[]/.test(normalized)) {
    return patternPath.slice(patternPath.lastIndexOf('.') + 1) === normalized;
  }
  return patternPath.replace(/\.\[\*\]/g, '[*]') === normalized;
}
