import type { CapturedRequest, ProxyConfig } from './types.js';
import { matchesFieldPattern, type JsonNode } from './jsonPaths.js';

export interface MatchKey {
  method: string;
  host: string;
  path: string;
  query: string;
  headers: string;
  body: string;
}

/**
 * Reduces a request to the parts that decide whether it matches a recording: the method, host,
 * path, an ignore-aware query string, the allowlisted headers and an ignore-aware body.
 *
 * Two requests that differ only in a `ClientToken`, a signature timestamp, or query param order
 * produce the same key.
 */
export function buildMatchKey(req: CapturedRequest, config: ProxyConfig): MatchKey {
  const url = new URL(req.url);
  const host = url.hostname;
  const path = url.pathname;

  const query = new URLSearchParams(url.search);
  for (const param of config.ignoreQueryParams) {
    query.delete(param);
  }
  query.sort();

  const headerEntries = Object.entries(req.headers)
    .filter(([name]) => config.keepHeaders.includes(name.toLowerCase()))
    .map(([name, value]) => [name.toLowerCase(), value] as const)
    .sort(([a], [b]) => a.localeCompare(b));

  const bodyIgnored = config.ignoreBodyFor.some((prefix) => `${host}${path}`.startsWith(prefix));
  const body = bodyIgnored ? '' : canonicalBody(req, config);

  return {
    method: req.method.toUpperCase(),
    host,
    path,
    query: query.toString(),
    headers: JSON.stringify(headerEntries),
    body,
  };
}

export function matchKeyToString(key: MatchKey): string {
  return `${key.method} ${key.host}${key.path}?${key.query}\n${key.headers}\n${key.body}`;
}

/**
 * Describes what differs between a request that missed on replay and a candidate recorded
 * request with the same method, host and path. Used to turn a miss into "body field X differs"
 * instead of a bare 404.
 */
export function describeDifferences(current: MatchKey, recorded: MatchKey): string[] {
  const differences: string[] = [];
  if (current.query !== recorded.query) {
    differences.push(`query differs: got "${current.query}", recording has "${recorded.query}"`);
  }
  if (current.headers !== recorded.headers) {
    differences.push('headers differ');
  }
  if (current.body !== recorded.body) {
    differences.push('body differs');
  }
  return differences;
}

function canonicalBody(req: CapturedRequest, config: ProxyConfig): string {
  if (req.body.length === 0) {
    return '';
  }
  const contentType = req.headers['content-type'] ?? '';
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(req.body.toString('utf8'));
      return canonicalJsonWithoutIgnored(parsed, config.ignoreFields);
    } catch {
      // not actually JSON despite the content-type; fall through to raw bytes
    }
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(req.body.toString('utf8'));
    for (const field of config.ignoreFields) {
      params.delete(field);
    }
    params.sort();
    return params.toString();
  }
  return req.body.toString('base64');
}

/** Stable JSON stringify (sorted object keys) with any field matching an ignore pattern removed. */
export function canonicalJsonWithoutIgnored(value: JsonNode, ignoreFields: string[]): string {
  if (ignoreFields.length === 0) {
    return canonicalStringify(value);
  }
  const ignoredPaths = new Set(
    walkFieldsIncludingContainers(value)
      .filter((match) => ignoreFields.some((pattern) => matchesFieldPattern(match.patternPath, pattern)))
      .map((match) => match.path)
  );
  return canonicalStringify(value, ignoredPaths);
}

/** Like walkFields, but also yields object/array container nodes so a whole sub-object can be ignored. */
function walkFieldsIncludingContainers(
  node: JsonNode,
  pathSegments: string[] = [],
  patternSegments: string[] = []
): Array<{ path: string; patternPath: string }> {
  const results: Array<{ path: string; patternPath: string }> = [];
  if (pathSegments.length > 0) {
    results.push({ path: pathSegments.join('.'), patternPath: patternSegments.join('.') });
  }
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      results.push(
        ...walkFieldsIncludingContainers(item, [...pathSegments, String(index)], [...patternSegments, '[*]'])
      );
    });
  } else if (typeof node === 'object' && node !== null) {
    for (const [key, value] of Object.entries(node)) {
      results.push(...walkFieldsIncludingContainers(value, [...pathSegments, key], [...patternSegments, key]));
    }
  }
  return results;
}

function canonicalStringify(value: JsonNode, ignoredPaths?: Set<string>, pathSegments: readonly string[] = []): string {
  const currentPath = pathSegments.join('.');
  if (ignoredPaths?.has(currentPath)) {
    return '"__ignored__"';
  }
  if (Array.isArray(value)) {
    return `[${value.map((item, index) => canonicalStringify(item, ignoredPaths, [...pathSegments, String(index)])).join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value).sort();
    const entries = keys
      .map((key) => [key, [...pathSegments, key]] as const)
      .filter(([, segs]) => !ignoredPaths?.has(segs.join('.')))
      .map(
        ([key, segs]) =>
          `${JSON.stringify(key)}:${canonicalStringify((value as Record<string, JsonNode>)[key], ignoredPaths, segs)}`
      );
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}
