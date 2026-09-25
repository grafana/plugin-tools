/**
 * Shared helpers for walking parsed JSON and matching against a small set of field-name and
 * JSON-path patterns. Used by matching (ignoreFields), redaction (redactFields/fakeFields) and
 * the field summary (fields.ts).
 *
 * Patterns are either a bare field name ("password", matches at any depth and any array index)
 * or a JSONPath-ish string using "$" and "[*]" for arrays, e.g. "$.items[*].author.email".
 */

export type JsonNode = string | number | boolean | null | JsonNode[] | { [key: string]: JsonNode };

export interface FieldMatch {
  /** Dotted path with array indices, e.g. "items.0.author.email". Stable for a given document shape. */
  path: string;
  /** The field-name-only path, with array indices collapsed to "[*]". Used to match config patterns. */
  patternPath: string;
  value: JsonNode;
}

/** Walks every leaf and object key in a JSON document, depth first. */
export function walkFields(node: JsonNode, pathSegments: string[] = [], patternSegments: string[] = []): FieldMatch[] {
  const results: FieldMatch[] = [];

  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      results.push(...walkFields(item, [...pathSegments, String(index)], [...patternSegments, '[*]']));
    });
    return results;
  }

  if (typeof node === 'object' && node !== null) {
    for (const [key, value] of Object.entries(node)) {
      results.push(...walkFields(value, [...pathSegments, key], [...patternSegments, key]));
    }
    return results;
  }

  if (pathSegments.length > 0) {
    results.push({
      path: pathSegments.join('.'),
      patternPath: patternSegments.join('.'),
      value: node,
    });
  }
  return results;
}

/** True when `patternPath` (e.g. "items.[*].author.email") matches `pattern` (a bare field name or a "$.a[*].b" path). */
export function matchesFieldPattern(patternPath: string, pattern: string): boolean {
  if (!pattern.startsWith('$')) {
    // bare field name: matches the last segment at any depth
    const segments = patternPath.split('.');
    return segments[segments.length - 1] === pattern;
  }
  const normalized = pattern
    .replace(/^\$\.?/, '')
    .replace(/\[\*\]/g, '[*]')
    .replace(/\./g, '.')
    .replace(/\[\*\]\.?/g, '[*].');
  const normalizedPatternPath = patternPath.replace(/\.\[\*\]/g, '[*]');
  return normalizedPatternPath === normalized.replace(/\.$/, '');
}

/** Returns the leaf-object path used to remove a matched field, split on "." with array indices as-is. */
export function pathToSegments(path: string): Array<string | number> {
  return path.split('.').map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

export function getAtPath(node: JsonNode, segments: Array<string | number>): JsonNode | undefined {
  let current: JsonNode | undefined = node;
  for (const segment of segments) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return undefined;
    }
    current = Array.isArray(current) ? current[segment as number] : current[segment as string];
  }
  return current;
}

export function setAtPath(node: JsonNode, segments: Array<string | number>, value: JsonNode): void {
  let current: JsonNode = node;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    current = Array.isArray(current)
      ? current[segment as number]
      : (current as Record<string, JsonNode>)[segment as string];
  }
  const last = segments[segments.length - 1];
  if (Array.isArray(current)) {
    current[last as number] = value;
  } else if (typeof current === 'object' && current !== null) {
    (current as Record<string, JsonNode>)[last as string] = value;
  }
}
