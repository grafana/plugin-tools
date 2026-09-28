import { promises as fs } from 'fs';
import path from 'path';
import { decodeUtf8Strict } from './bytes.js';
import type { CapturedRequest, CapturedResponse, Har, HarEntry, HarNameValue, ProxyConfig } from './types.js';
import { buildMatchKey, describeDifferences, matchKeyToString, type MatchKey } from './match.js';

const CREATOR = { name: '@grafana/plugin-e2e-proxy', version: '0' };

export function emptyHar(): Har {
  return { log: { version: '1.2', creator: CREATOR, entries: [] } };
}

export async function readHar(filePath: string): Promise<Har> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as Har;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return emptyHar();
    }
    throw err;
  }
}

/** Writes stable, pretty-printed HAR: entries sorted by match key then by recording order, so PR diffs are readable. */
export async function writeHar(filePath: string, har: Har, config: ProxyConfig): Promise<void> {
  const sorted = {
    ...har,
    log: {
      ...har.log,
      entries: [...har.log.entries].sort((a, b) => {
        const keyA = matchKeyToString(buildMatchKey(harRequestToCaptured(a.request), config));
        const keyB = matchKeyToString(buildMatchKey(harRequestToCaptured(b.request), config));
        if (keyA !== keyB) {
          return keyA.localeCompare(keyB);
        }
        return a.startedDateTime.localeCompare(b.startedDateTime);
      }),
    },
  };
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  // write then rename, so a proxy killed mid-write never leaves a truncated recording behind
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
  await fs.rename(tmpPath, filePath);
}

/** Splits a recorded entry back into a request/response pair, for re-running the sanitize pipeline offline. */
export function harEntryToCaptured(entry: HarEntry): { req: CapturedRequest; res: CapturedResponse } {
  return {
    req: harRequestToCaptured(entry.request),
    res: {
      status: entry.response.status,
      statusText: entry.response.statusText,
      headers: Object.fromEntries(entry.response.headers.map((h) => [h.name.toLowerCase(), h.value])),
      body: Buffer.from(entry.response.content.text, entry.response.content.encoding ?? 'utf8'),
    },
  };
}

function harRequestToCaptured(req: HarEntry['request']): CapturedRequest {
  const headers: Record<string, string> = Object.fromEntries(req.headers.map((h) => [h.name.toLowerCase(), h.value]));
  // older recordings may not have kept content-type, but matching needs it to parse the body the same way.
  // the octet-stream placeholder means the request had none, so restoring it would break the match.
  if (!headers['content-type'] && req.postData?.mimeType && req.postData.mimeType !== 'application/octet-stream') {
    headers['content-type'] = req.postData.mimeType;
  }
  return {
    method: req.method,
    url: req.url,
    headers,
    body: Buffer.from(req.postData?.text ?? '', 'utf8'),
  };
}

export function toHarEntry(req: CapturedRequest, res: CapturedResponse, startedAt: Date, durationMs: number): HarEntry {
  const url = new URL(req.url);
  return {
    startedDateTime: startedAt.toISOString(),
    time: durationMs,
    request: {
      method: req.method,
      url: req.url,
      httpVersion: 'HTTP/1.1',
      headers: toNameValue(req.headers),
      queryString: toNameValue(Object.fromEntries(url.searchParams.entries())),
      cookies: [],
      headersSize: -1,
      bodySize: req.body.length,
      ...(req.body.length > 0
        ? {
            postData: {
              mimeType: req.headers['content-type'] ?? 'application/octet-stream',
              text: req.body.toString('utf8'),
            },
          }
        : {}),
    },
    response: {
      status: res.status,
      statusText: res.statusText,
      httpVersion: 'HTTP/1.1',
      headers: toNameValue(res.headers),
      cookies: [],
      content: responseContent(res),
      redirectURL: '',
      headersSize: -1,
      bodySize: res.body.length,
    },
    cache: {},
    timings: { send: 0, wait: durationMs, receive: 0 },
  };
}

/** Text bodies are stored as-is so diffs stay readable; anything that isn't valid UTF-8 is stored as base64. */
function responseContent(res: CapturedResponse): HarEntry['response']['content'] {
  const mimeType = res.headers['content-type'] ?? 'application/octet-stream';
  const text = decodeUtf8Strict(res.body);
  if (text === undefined) {
    return { size: res.body.length, mimeType, text: res.body.toString('base64'), encoding: 'base64' };
  }
  return { size: res.body.length, mimeType, text };
}

function toNameValue(headers: Record<string, string>): HarNameValue[] {
  return Object.entries(headers).map(([name, value]) => ({ name, value }));
}

/**
 * Serves recorded responses for replay. Requests that map to the same match key are replayed
 * in the order they were recorded (so a polling loop sees "running" then "succeeded"), and the
 * last response in the sequence repeats once the sequence is exhausted.
 */
export class ReplayStore {
  private readonly sequences = new Map<string, HarEntry[]>();
  private readonly cursors = new Map<string, number>();
  /** One representative structured key per match-key string, for the closest-match diff on a miss. */
  private readonly structuredKeys = new Map<string, MatchKey>();

  constructor(har: Har, config: ProxyConfig) {
    for (const entry of har.log.entries) {
      const structuredKey = buildMatchKey(harRequestToCaptured(entry.request), config);
      const key = matchKeyToString(structuredKey);
      const sequence = this.sequences.get(key) ?? [];
      sequence.push(entry);
      this.sequences.set(key, sequence);
      this.structuredKeys.set(key, structuredKey);
    }
  }

  /** Returns the next response for this request's match key, or undefined on a miss. */
  next(req: CapturedRequest, config: ProxyConfig): HarEntry | undefined {
    const key = matchKeyToString(buildMatchKey(req, config));
    const sequence = this.sequences.get(key);
    if (!sequence || sequence.length === 0) {
      return undefined;
    }
    const cursor = this.cursors.get(key) ?? 0;
    const index = Math.min(cursor, sequence.length - 1);
    this.cursors.set(key, cursor + 1);
    return sequence[index];
  }

  /**
   * On a miss, finds a recorded request with the same method, host and path and reports what
   * differs (query, headers or body). Returns undefined when nothing with that method/host/path
   * was ever recorded.
   */
  closestMatch(req: CapturedRequest, config: ProxyConfig): { url: string; differences: string[] } | undefined {
    const current = buildMatchKey(req, config);
    for (const [key, candidate] of this.structuredKeys) {
      if (candidate.method === current.method && candidate.host === current.host && candidate.path === current.path) {
        const entry = this.sequences.get(key)![0];
        return { url: entry.request.url, differences: describeDifferences(current, candidate) };
      }
    }
    return undefined;
  }
}
