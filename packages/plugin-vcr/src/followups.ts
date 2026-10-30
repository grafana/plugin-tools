import { isJsonContentType, parseJsonLossless, walkFields } from './jsonPaths.js';
import type { HarEntry } from './types.js';

/** Server-issued identifiers: query IDs, UUIDs, ARNs. Requiring a digit leaves out plain words and names. */
const IDENTIFIER_RE = /^(?=.*\d)[A-Za-z0-9_\-:./]{8,256}$/;

/**
 * Finds the recorded responses whose identifiers the client went on to use. A response counts
 * when it introduces an identifier (one no earlier request contained, such as a new query ID) and a
 * later request sends that identifier back.
 *
 * Replay uses this when the same request was recorded many times: a client that re-runs a query
 * on every poll leaves behind executions it abandoned, and replaying one of those means the next
 * status request has nothing to match.
 */
export function findFollowedUpEntries(entries: HarEntry[]): Set<HarEntry> {
  const ordered = [...entries].sort((a, b) => a.startedDateTime.localeCompare(b.startedDateTime));
  const requestTexts = ordered.map((entry) => `${entry.request.url}\n${entry.request.postData?.text ?? ''}`);
  const followedUp = new Set<HarEntry>();

  ordered.forEach((entry, index) => {
    for (const identifier of responseIdentifiers(entry)) {
      const firstSeen = requestTexts.findIndex((text) => text.includes(identifier));
      if (firstSeen > index) {
        followedUp.add(entry);
        return;
      }
    }
  });

  return followedUp;
}

function responseIdentifiers(entry: HarEntry): string[] {
  const { content } = entry.response;
  if (!content.text || content.encoding === 'base64' || !isJsonContentType(content.mimeType)) {
    return [];
  }
  try {
    return walkFields(parseJsonLossless(content.text))
      .map((field) => field.value)
      .filter((value): value is string => typeof value === 'string' && IDENTIFIER_RE.test(value));
  } catch {
    return [];
  }
}
