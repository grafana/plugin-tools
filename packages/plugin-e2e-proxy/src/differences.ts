import { leafToString, parseJsonLossless, walkFields } from './jsonPaths.js';
import type { MatchKey } from './match.js';

const MAX_REPORTED = 5;
const MAX_VALUE_LENGTH = 60;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}|^\d{10}(\d{3})?$/;

/**
 * What differs between a request that missed on replay and a recorded one with the same method,
 * host and path, field by field: `body field "Sql": got "...", recording has "..."`. Both sides are
 * sanitized requests, so the values are safe to log.
 */
export function describeDifferences(current: MatchKey, recorded: MatchKey): string[] {
  const differences = listDifferences(current, recorded);
  if (differences.length <= MAX_REPORTED) {
    return differences;
  }
  return [...differences.slice(0, MAX_REPORTED), `and ${differences.length - MAX_REPORTED} more`];
}

/** Every difference, untruncated. */
export function listDifferences(current: MatchKey, recorded: MatchKey): string[] {
  return compare(current, recorded).differences;
}

/**
 * Orders candidate recordings for "closest match": fewer differing fields first, then more shared
 * leading text in the fields that do differ, so a query that only differs in a timestamp beats an
 * unrelated query that also differs in one field.
 */
export function closenessRank(current: MatchKey, recorded: MatchKey): [number, number] {
  const { differences, sharedPrefix } = compare(current, recorded);
  return [differences.length, -sharedPrefix];
}

interface Comparison {
  differences: string[];
  sharedPrefix: number;
}

function compare(current: MatchKey, recorded: MatchKey): Comparison {
  const parts = [
    diffPairs('query param', queryPairs(current.query), queryPairs(recorded.query)),
    diffPairs('header', headerPairs(current.headers), headerPairs(recorded.headers)),
    diffBodies(current.body, recorded.body),
  ];
  return {
    differences: parts.flatMap((part) => part.differences),
    sharedPrefix: parts.reduce((sum, part) => sum + part.sharedPrefix, 0),
  };
}

function queryPairs(query: string): Map<string, string> {
  const pairs = new Map<string, string>();
  for (const [name, value] of new URLSearchParams(query)) {
    pairs.set(name, pairs.has(name) ? `${pairs.get(name)},${value}` : value);
  }
  return pairs;
}

function headerPairs(headers: string): Map<string, string> {
  return new Map(JSON.parse(headers) as Array<[string, string]>);
}

function diffBodies(current: string, recorded: string): Comparison {
  if (current === recorded) {
    return { differences: [], sharedPrefix: 0 };
  }
  const currentFields = jsonFields(current);
  const recordedFields = jsonFields(recorded);
  if (currentFields && recordedFields) {
    return diffPairs('body field', currentFields, recordedFields);
  }
  return { differences: ['body differs'], sharedPrefix: commonPrefixLength(current, recorded) };
}

function jsonFields(body: string): Map<string, string> | undefined {
  if (body === '') {
    return new Map();
  }
  try {
    return new Map(walkFields(parseJsonLossless(body)).map((field) => [field.path, leafToString(field.value)]));
  } catch {
    return undefined;
  }
}

function diffPairs(label: string, current: Map<string, string>, recorded: Map<string, string>): Comparison {
  const names = [...new Set([...current.keys(), ...recorded.keys()])].sort();
  const differences: string[] = [];
  let sharedPrefix = 0;
  for (const name of names) {
    const got = current.get(name);
    const had = recorded.get(name);
    if (got === had) {
      continue;
    }
    if (got === undefined) {
      differences.push(`${label} "${name}" is missing, recording has "${shorten(had!)}"`);
    } else if (had === undefined) {
      differences.push(`${label} "${name}" isn't in the recording (got "${shorten(got)}")`);
    } else {
      const [gotExcerpt, hadExcerpt] = excerpts(got, had);
      differences.push(`${label} "${name}": got "${gotExcerpt}", recording has "${hadExcerpt}"${hint(got, had)}`);
      sharedPrefix += commonPrefixLength(got, had);
    }
  }
  return { differences, sharedPrefix };
}

function commonPrefixLength(a: string, b: string): number {
  let length = 0;
  while (length < a.length && a[length] === b[length]) {
    length++;
  }
  return length;
}

function hint(got: string, had: string): string {
  if (UUID_RE.test(got) && UUID_RE.test(had)) {
    return ' - looks generated per request, add it to ignoreFields';
  }
  if (TIME_RE.test(got) && TIME_RE.test(had)) {
    return " - looks like a time, pin the test's time range or add it to ignoreFields";
  }
  return '';
}

function shorten(value: string): string {
  return value.length <= MAX_VALUE_LENGTH ? value : `${value.slice(0, MAX_VALUE_LENGTH)}…`;
}

/** Both values cut to the same window around where they first differ, e.g. a timestamp deep inside a SQL string. */
function excerpts(a: string, b: string): [string, string] {
  if (a.length <= MAX_VALUE_LENGTH && b.length <= MAX_VALUE_LENGTH) {
    return [a, b];
  }
  const start = Math.max(0, commonPrefixLength(a, b) - 20);
  const cut = (value: string): string =>
    `${start > 0 ? '…' : ''}${value.slice(start, start + MAX_VALUE_LENGTH)}${start + MAX_VALUE_LENGTH < value.length ? '…' : ''}`;
  return [cut(a), cut(b)];
}
