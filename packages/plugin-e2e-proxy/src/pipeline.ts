import { decodeUtf8Strict } from './bytes.js';
import { isJsonContentType, parseJsonLossless, type JsonNode } from './jsonPaths.js';
import { applyRedactionRules, type FakeValueStore, type SecretScrubber } from './redact.js';
import type { CapturedRequest, CapturedResponse, ProxyConfig } from './types.js';

/** Always stored, whatever keepHeaders says: never a secret, and both sides need it to parse the body. */
const ALWAYS_KEPT_HEADERS = ['content-type'];

/**
 * Turns a real request/response pair into what gets written to disk: only allowlisted headers,
 * redacted and faked JSON fields, and every known secret value scrubbed out of what's left.
 *
 * The response goes first, so a secret it issues (an OAuth token, for example) is learned before
 * anything is scrubbed and is caught in its own headers and body too.
 */
export function sanitizeForRecording(
  req: CapturedRequest,
  res: CapturedResponse,
  config: ProxyConfig,
  scrubber: SecretScrubber,
  fakeStore: FakeValueStore,
  scrubCounts: Record<string, number>
): { req: CapturedRequest; res: CapturedResponse } {
  const sanitizedRes = sanitizeResponse(res, config, scrubber, fakeStore, scrubCounts);
  return { req: sanitizeRequest(req, config, scrubber, scrubCounts), res: sanitizedRes };
}

/**
 * The request half of the pipeline. Replay runs each live request through this too, with the
 * current environment's secrets, so a request carrying a credential still matches a recording
 * made with a different value of it.
 */
export function sanitizeRequest(
  req: CapturedRequest,
  config: ProxyConfig,
  scrubber: SecretScrubber,
  scrubCounts: Record<string, number>
): CapturedRequest {
  return {
    ...req,
    url: scrubber.scrub(redactCredentialQueryParams(req.url, config.credentialQueryParams), scrubCounts),
    headers: scrubHeaderValues(keepAllowlisted(req.headers, config.keepHeaders), scrubber, scrubCounts),
    body: scrubBuffer(req.body, scrubber, scrubCounts),
  };
}

function sanitizeResponse(
  res: CapturedResponse,
  config: ProxyConfig,
  scrubber: SecretScrubber,
  fakeStore: FakeValueStore,
  scrubCounts: Record<string, number>
): CapturedResponse {
  const redactedBody = redactJsonBody(res.body, res.headers['content-type'] ?? '', config, scrubber, fakeStore);
  return {
    ...res,
    body: scrubBuffer(redactedBody, scrubber, scrubCounts),
    headers: scrubHeaderValues(keepAllowlisted(res.headers, config.keepResponseHeaders), scrubber, scrubCounts),
  };
}

function keepAllowlisted(headers: Record<string, string>, allowlist: string[]): Record<string, string> {
  const kept = new Set([...allowlist, ...ALWAYS_KEPT_HEADERS].map((h) => h.toLowerCase()));
  return Object.fromEntries(Object.entries(headers).filter(([name]) => kept.has(name.toLowerCase())));
}

function redactCredentialQueryParams(rawUrl: string, credentialQueryParams: string[]): string {
  const url = new URL(rawUrl);
  const credentialNames = new Set(credentialQueryParams.map((name) => name.toLowerCase()));
  const credentialParams = [...new Set(url.searchParams.keys())].filter((name) =>
    credentialNames.has(name.toLowerCase())
  );
  if (credentialParams.length === 0) {
    return rawUrl;
  }
  credentialParams.forEach((name) => url.searchParams.set(name, 'REDACTED'));
  return url.toString();
}

function redactJsonBody(
  body: Buffer,
  contentType: string,
  config: ProxyConfig,
  scrubber: SecretScrubber,
  fakeStore: FakeValueStore
): Buffer {
  if (body.length === 0 || !isJsonContentType(contentType)) {
    return body;
  }
  let json: JsonNode;
  try {
    json = parseJsonLossless(body.toString('utf8'));
  } catch {
    // not actually JSON despite the content-type; the raw-text scrub pass still runs on it
    return body;
  }
  scrubber.learnFromJson(json, config.learnSecretFields);
  const result = applyRedactionRules(json, config.redactFields, config.fakeFields, fakeStore);
  return result.changed ? Buffer.from(JSON.stringify(result.json), 'utf8') : body;
}

function scrubHeaderValues(
  headers: Record<string, string>,
  scrubber: SecretScrubber,
  counts: Record<string, number>
): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([name, value]) => [name, scrubber.scrub(value, counts)]));
}

/** Binary bodies are left untouched here. The pre-write scan still checks them for known secrets. */
function scrubBuffer(body: Buffer, scrubber: SecretScrubber, counts: Record<string, number>): Buffer {
  const text = body.length > 0 ? decodeUtf8Strict(body) : undefined;
  if (text === undefined) {
    return body;
  }
  const scrubbed = scrubber.scrub(text, counts);
  return scrubbed === text ? body : Buffer.from(scrubbed, 'utf8');
}
