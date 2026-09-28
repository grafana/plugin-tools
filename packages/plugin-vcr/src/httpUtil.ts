import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import type { CapturedRequest, CapturedResponse } from './types.js';

/** Headers that only make sense between the client and this hop, never forwarded or replayed as-is. */
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'keep-alive',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

export async function collectBody(stream: http.IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

export function flattenHeaders(headers: http.IncomingHttpHeaders): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }
    flat[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value;
  }
  return flat;
}

function withoutHopByHop(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).filter(([name]) => !HOP_BY_HOP_HEADERS.has(name)));
}

export async function captureRequest(req: http.IncomingMessage, forcedOrigin?: string): Promise<CapturedRequest> {
  const body = await collectBody(req);
  const url = forcedOrigin ? `${forcedOrigin}${req.url}` : req.url!;
  return { method: req.method ?? 'GET', url, headers: flattenHeaders(req.headers), body };
}

/**
 * Sends the real request described by `captured` to the actual target and captures the response.
 * The request goes out as the client sent it, apart from hop-by-hop framing, so signatures such as
 * SigV4 stay valid. The response body comes back decoded, see `decodeContentEncoding`.
 */
export function forwardRequest(captured: CapturedRequest): Promise<CapturedResponse> {
  const url = new URL(captured.url);
  const transport = url.protocol === 'https:' ? https : http;
  const headers = withoutHopByHop(captured.headers);
  if (captured.body.length > 0 || 'content-length' in captured.headers) {
    headers['content-length'] = String(captured.body.length);
  }

  return new Promise((resolve, reject) => {
    const upstreamReq = transport.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: captured.method,
        headers,
      },
      (upstreamRes) => {
        collectBody(upstreamRes)
          .then((body) =>
            resolve(
              decodeContentEncoding({
                status: upstreamRes.statusCode ?? 502,
                statusText: upstreamRes.statusMessage ?? '',
                headers: flattenHeaders(upstreamRes.headers),
                body,
              })
            )
          )
          .catch(reject);
      }
    );
    upstreamReq.on('error', reject);
    upstreamReq.end(captured.body.length > 0 ? captured.body : undefined);
  });
}

/**
 * Removes the body's content-encoding, so recordings hold text that redaction can parse and replay
 * can serve to any client. Go's transport asks for gzip on its own and handles a plain answer just
 * as well. A coding this doesn't know is left as it is, header included.
 */
export function decodeContentEncoding(res: CapturedResponse): CapturedResponse {
  const encoding = res.headers['content-encoding'];
  if (!encoding || res.body.length === 0) {
    return res;
  }
  const codings = encoding
    .split(',')
    .map((coding) => coding.trim().toLowerCase())
    .filter((coding) => coding !== '' && coding !== 'identity');

  let body = res.body;
  for (const coding of codings.reverse()) {
    const decoded = decodeOne(coding, body);
    if (!decoded) {
      return res;
    }
    body = decoded;
  }
  const headers = Object.fromEntries(Object.entries(res.headers).filter(([name]) => name !== 'content-encoding'));
  return { ...res, headers, body };
}

function decodeOne(coding: string, body: Buffer): Buffer | undefined {
  switch (coding) {
    case 'gzip':
    case 'x-gzip':
      return zlib.gunzipSync(body);
    case 'deflate':
      // servers disagree on whether deflate means zlib-wrapped or raw
      try {
        return zlib.inflateSync(body);
      } catch {
        return zlib.inflateRawSync(body);
      }
    case 'br':
      return zlib.brotliDecompressSync(body);
    default:
      return undefined;
  }
}

export function sendResponse(res: http.ServerResponse, captured: CapturedResponse): void {
  res.writeHead(captured.status, captured.statusText, {
    ...withoutHopByHop(captured.headers),
    'content-length': String(captured.body.length),
  });
  res.end(captured.body);
}

export function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = Buffer.from(JSON.stringify(body), 'utf8');
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': String(payload.length) });
  res.end(payload);
}
