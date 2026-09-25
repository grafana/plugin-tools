import http from 'node:http';
import https from 'node:https';
import type { CapturedRequest, CapturedResponse } from './types.js';

/** Headers that only make sense between the client and this hop, never forwarded or replayed. */
const HOP_BY_HOP_HEADERS = new Set(['proxy-connection', 'connection', 'transfer-encoding', 'content-length']);

export async function collectBody(req: http.IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
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

export async function captureRequest(req: http.IncomingMessage, forcedOrigin?: string): Promise<CapturedRequest> {
  const body = await collectBody(req);
  const url = forcedOrigin ? `${forcedOrigin}${req.url}` : req.url!;
  return { method: req.method ?? 'GET', url, headers: flattenHeaders(req.headers), body };
}

/** Sends the real request described by `captured` to the actual target and captures the response. */
export function forwardRequest(captured: CapturedRequest): Promise<CapturedResponse> {
  const url = new URL(captured.url);
  const transport = url.protocol === 'https:' ? https : http;
  const headers = Object.fromEntries(
    Object.entries(captured.headers).filter(([name]) => !HOP_BY_HOP_HEADERS.has(name))
  );

  return new Promise((resolve, reject) => {
    const upstreamReq = transport.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: captured.method,
        headers,
      },
      async (upstreamRes) => {
        const body = await collectBody(upstreamRes);
        resolve({
          status: upstreamRes.statusCode ?? 502,
          statusText: upstreamRes.statusMessage ?? '',
          headers: flattenHeaders(upstreamRes.headers),
          body,
        });
      }
    );
    upstreamReq.on('error', reject);
    if (captured.body.length > 0) {
      upstreamReq.write(captured.body);
    }
    upstreamReq.end();
  });
}

export function sendResponse(res: http.ServerResponse, captured: CapturedResponse): void {
  const headers = Object.fromEntries(
    Object.entries(captured.headers).filter(([name]) => !HOP_BY_HOP_HEADERS.has(name))
  );
  res.writeHead(captured.status, captured.statusText, { ...headers, 'content-length': String(captured.body.length) });
  res.end(captured.body);
}

export function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = Buffer.from(JSON.stringify(body), 'utf8');
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': String(payload.length) });
  res.end(payload);
}
