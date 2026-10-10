import http from 'node:http';
import zlib from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { collectBody, forwardRequest } from './httpUtil.js';

interface Seen {
  headers: http.IncomingHttpHeaders;
  body: string;
}

let server: http.Server | undefined;

function startServer(
  handler: (req: http.IncomingMessage, res: http.ServerResponse, seen: Seen) => void
): Promise<number> {
  server = http.createServer((req, res) => {
    void collectBody(req).then((body) => handler(req, res, { headers: req.headers, body: body.toString() }));
  });
  return new Promise((resolve) => {
    server!.listen(0, '127.0.0.1', () => {
      const address = server!.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });
}

afterEach(async () => {
  await new Promise((resolve) => server?.close(resolve));
  server = undefined;
});

function echoSeen(): (req: http.IncomingMessage, res: http.ServerResponse, seen: Seen) => void {
  return (_req, res, seen) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(seen));
  };
}

describe('forwardRequest', () => {
  it('sends a POST body with content-length, not chunked, so signed requests stay valid', async () => {
    const port = await startServer(echoSeen());
    const res = await forwardRequest({
      method: 'POST',
      url: `http://127.0.0.1:${port}/`,
      headers: { 'content-type': 'application/json', 'content-length': '11', 'transfer-encoding': 'chunked' },
      body: Buffer.from('{"a":"b12"}'),
    });
    const seen: Seen = JSON.parse(res.body.toString());
    expect(seen.headers['content-length']).toBe('11');
    expect(seen.headers['transfer-encoding']).toBeUndefined();
    expect(seen.body).toBe('{"a":"b12"}');
  });

  it('delivers a GET body, as Elasticsearch-style _search requests send', async () => {
    const port = await startServer(echoSeen());
    const res = await forwardRequest({
      method: 'GET',
      url: `http://127.0.0.1:${port}/_search`,
      headers: { 'content-type': 'application/json' },
      body: Buffer.from('{"query":{}}'),
    });
    expect(JSON.parse(res.body.toString()).body).toBe('{"query":{}}');
  });

  it('decodes a gzipped response and drops content-encoding, so recordings hold text', async () => {
    const port = await startServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json', 'content-encoding': 'gzip' });
      res.end(zlib.gzipSync('{"ok":true}'));
    });
    const res = await forwardRequest({
      method: 'GET',
      url: `http://127.0.0.1:${port}/`,
      headers: { 'accept-encoding': 'gzip' },
      body: Buffer.from(''),
    });
    expect(res.body.toString()).toBe('{"ok":true}');
    expect(res.headers['content-encoding']).toBeUndefined();
  });

  it('rejects instead of crashing the process when the upstream resets mid-body', async () => {
    const port = await startServer((req, res) => {
      res.writeHead(200, { 'content-type': 'application/json', 'content-length': '1000' });
      res.write('{"partial":');
      setTimeout(() => req.socket.destroy(), 10);
    });
    await expect(
      forwardRequest({ method: 'GET', url: `http://127.0.0.1:${port}/`, headers: {}, body: Buffer.from('') })
    ).rejects.toThrow();
  });
});
