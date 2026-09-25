import { applyFakeFields, applyFieldRedaction, type FakeValueStore, type SecretScrubber } from './redact.js';
import type { CapturedRequest, CapturedResponse, ProxyConfig } from './types.js';

/**
 * Turns a real request/response pair into what gets written to disk: only allowlisted headers,
 * redacted and faked JSON fields, and every known secret value scrubbed out of what's left.
 *
 * Order matters. Secrets issued in this very response (an OAuth token, for example) are learned
 * first, so the final scrub pass also catches that value inside this same response body.
 *
 * Bodies are treated as UTF-8 text. A genuinely binary request or response body round-trips
 * through this pipeline unless byte sequences happen to be invalid UTF-8, in which case they are
 * replaced by the platform's UTF-8 replacement character. Binary bodies aren't expected for the
 * JSON/REST APIs this proxy targets; this is a known limitation, not a design goal.
 */
export function sanitizeForRecording(
  req: CapturedRequest,
  res: CapturedResponse,
  config: ProxyConfig,
  scrubber: SecretScrubber,
  fakeStore: FakeValueStore,
  scrubCounts: Record<string, number>
): { req: CapturedRequest; res: CapturedResponse } {
  const keptRequestHeaders = keepAllowlisted(req.headers, config.keepHeaders);
  const keptResponseHeaders = keepAllowlisted(res.headers, config.keepResponseHeaders);

  const responseBody = redactJsonBody(res.body, res.headers['content-type'] ?? '', config, scrubber, fakeStore);

  return {
    req: {
      ...req,
      headers: scrubHeaderValues(keptRequestHeaders, scrubber, scrubCounts),
      body: scrubBuffer(req.body, scrubber, scrubCounts),
    },
    res: {
      ...res,
      headers: scrubHeaderValues(keptResponseHeaders, scrubber, scrubCounts),
      body: scrubBuffer(responseBody, scrubber, scrubCounts),
    },
  };
}

function keepAllowlisted(headers: Record<string, string>, allowlist: string[]): Record<string, string> {
  const lowerAllowlist = allowlist.map((h) => h.toLowerCase());
  return Object.fromEntries(Object.entries(headers).filter(([name]) => lowerAllowlist.includes(name.toLowerCase())));
}

function redactJsonBody(
  body: Buffer,
  contentType: string,
  config: ProxyConfig,
  scrubber: SecretScrubber,
  fakeStore: FakeValueStore
): Buffer {
  if (body.length === 0 || !contentType.includes('json')) {
    return body;
  }
  try {
    let json = JSON.parse(body.toString('utf8'));
    // learn secrets before redacting, so this response's own scrub pass also catches a value it just issued
    scrubber.learnFromJson(json, config.learnSecretFields);
    json = applyFieldRedaction(json, config.redactFields);
    json = applyFakeFields(json, config.fakeFields, fakeStore);
    return Buffer.from(JSON.stringify(json), 'utf8');
  } catch {
    // not actually JSON despite the content-type; the raw-text scrub pass below still runs on it
    return body;
  }
}

function scrubHeaderValues(
  headers: Record<string, string>,
  scrubber: SecretScrubber,
  counts: Record<string, number>
): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([name, value]) => [name, scrubber.scrub(value, counts)]));
}

function scrubBuffer(body: Buffer, scrubber: SecretScrubber, counts: Record<string, number>): Buffer {
  if (body.length === 0) {
    return body;
  }
  return Buffer.from(scrubber.scrub(body.toString('utf8'), counts), 'utf8');
}
