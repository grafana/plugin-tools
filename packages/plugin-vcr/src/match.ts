import type { CapturedRequest, ProxyConfig } from './types.js';
import {
  childKeyPath,
  isJsonContentType,
  isJsonObject,
  isRawJson,
  matchesFieldPattern,
  parseJsonLossless,
  visitJson,
  type JsonNode,
} from './jsonPaths.js';

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

function canonicalBody(req: CapturedRequest, config: ProxyConfig): string {
  if (req.body.length === 0) {
    return '';
  }
  const contentType = req.headers['content-type'] ?? '';
  if (isJsonContentType(contentType)) {
    let parsed: JsonNode | undefined;
    try {
      parsed = parseJsonLossless(req.body.toString('utf8'));
    } catch {
      // not actually JSON despite the content-type; falls through to raw bytes
    }
    if (parsed !== undefined) {
      return canonicalJsonWithoutIgnored(parsed, config.ignoreFields);
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
  const ignoredPaths = new Set<string>();
  if (ignoreFields.length > 0) {
    visitJson(value, (match) => {
      if (ignoreFields.some((pattern) => matchesFieldPattern(match.patternPath, pattern))) {
        ignoredPaths.add(match.path);
      }
    });
  }
  return canonicalStringify(value, ignoredPaths, '');
}

function canonicalStringify(value: JsonNode, ignoredPaths: Set<string>, path: string): string {
  if (Array.isArray(value)) {
    const items = value.map((item, index) => {
      const itemPath = childKeyPath(path, String(index));
      return ignoredPaths.has(itemPath) ? '"__ignored__"' : canonicalStringify(item, ignoredPaths, itemPath);
    });
    return `[${items.join(',')}]`;
  }
  if (isJsonObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .filter((key) => !ignoredPaths.has(childKeyPath(path, key)))
      .map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key], ignoredPaths, childKeyPath(path, key))}`);
    return `{${entries.join(',')}}`;
  }
  return isRawJson(value) ? value.rawJSON : JSON.stringify(value);
}
