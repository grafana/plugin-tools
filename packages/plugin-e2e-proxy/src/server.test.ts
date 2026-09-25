import { mkdtemp, rm } from 'fs/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mergeConfig } from './config.js';
import { readHar } from './har.js';
import { startProxyServer, type ProxyServerHandle } from './server.js';
import { loadOrCreateCA, signLeafCertificate } from './tls.js';

/** A minimal fake third-party API: one JSON endpoint, and a counter of how many times it was hit. */
function startFakeHttpApi(): Promise<{ server: http.Server; port: number }> {
  let callCount = 0;
  const server = http.createServer((req, res) => {
    callCount++;
    if (req.url === '/v1/status') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ callCount, secret: 'should-not-leak' }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, port: typeof address === 'object' && address ? address.port : 0 });
    });
  });
}

async function requestThroughProxy(proxyPort: number, targetUrl: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: proxyPort, method: 'GET', path: targetUrl }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.end();
  });
}

describe('startProxyServer: plain HTTP (record/replay over absolute-form proxying)', () => {
  let dir: string;
  let harPath: string;
  let api: { server: http.Server; port: number };
  let proxy: ProxyServerHandle | undefined;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'plugin-e2e-proxy-server-'));
    harPath = join(dir, 'api.har');
    api = await startFakeHttpApi();
  });

  afterEach(async () => {
    await proxy?.close().catch(() => undefined);
    proxy = undefined;
    await new Promise((resolve) => api.server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  });

  it('records real traffic, redacts it, then replays it with the real API down', async () => {
    const ca = await loadOrCreateCA(join(dir, 'ca'));
    const config = mergeConfig({ hosts: ['127.0.0.1'], redactFields: ['secret'] });

    proxy = await startProxyServer({ mode: 'record', config, harPath, ca, knownSecrets: {} });
    const recorded = await requestThroughProxy(proxy.port, `http://127.0.0.1:${api.port}/v1/status`);
    expect(recorded.status).toBe(200);
    expect(JSON.parse(recorded.body).callCount).toBe(1);
    expect(JSON.parse(recorded.body).secret).toBe('should-not-leak'); // the plugin still gets the real response

    const summary = await proxy.close();
    proxy = undefined;
    expect(summary?.files).toEqual([harPath]);
    expect(summary?.findings).toEqual([]);

    const har = await readHar(harPath);
    expect(har.log.entries).toHaveLength(1);
    expect(har.log.entries[0].response.content.text).not.toContain('should-not-leak'); // but the recording is redacted

    // the real API is now shut down - replay must not depend on it
    await new Promise((resolve) => api.server.close(resolve));

    proxy = await startProxyServer({ mode: 'replay', config, harPath, ca, knownSecrets: {} });
    const replayed = await requestThroughProxy(proxy.port, `http://127.0.0.1:${api.port}/v1/status`);
    expect(replayed.status).toBe(200);
    expect(JSON.parse(replayed.body).callCount).toBe(1);
    expect(proxy.stats.matched).toBe(1);
  });

  it('fails closed on replay when a request has no recording, instead of calling the real API', async () => {
    const ca = await loadOrCreateCA(join(dir, 'ca'));
    const config = mergeConfig({ hosts: ['127.0.0.1'] });

    proxy = await startProxyServer({ mode: 'replay', config, harPath, ca, knownSecrets: {} });
    const result = await requestThroughProxy(proxy.port, `http://127.0.0.1:${api.port}/v1/status`);

    expect(result.status).toBe(502);
    expect(JSON.parse(result.body).error).toBe('no recording');
    expect(proxy.stats.missed).toBe(1);
  });

  it('passes non-recorded hosts straight through in replay mode', async () => {
    const ca = await loadOrCreateCA(join(dir, 'ca'));
    const config = mergeConfig({ hosts: ['some-other-host.example.com'] });

    proxy = await startProxyServer({ mode: 'replay', config, harPath, ca, knownSecrets: {} });
    const result = await requestThroughProxy(proxy.port, `http://127.0.0.1:${api.port}/v1/status`);

    expect(result.status).toBe(200);
    expect(proxy.stats.passthrough).toBe(1);
    expect(proxy.stats.missed).toBe(0);
  });
});

describe('startProxyServer: HTTPS via CONNECT (TLS interception)', () => {
  let dir: string;
  let harPath: string;
  let apiServer: https.Server;
  let apiPort: number;
  let proxy: ProxyServerHandle | undefined;
  let caPem: string;

  // the proxy's own outbound leg (forwardRequest) validates the upstream cert against Node's
  // normal trust store, exactly as it should for a real third-party API. For this test, the
  // "upstream" is our own throwaway CA, so it has to be added to that trust store too.
  let originalGlobalAgentCa: https.AgentOptions['ca'];

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'plugin-e2e-proxy-tls-'));
    harPath = join(dir, 'api.har');

    const ca = await loadOrCreateCA(join(dir, 'ca'));
    caPem = ca.certPem;
    const leaf = signLeafCertificate('127.0.0.1', ca);
    apiServer = https.createServer({ cert: leaf.certPem, key: leaf.keyPem }, (_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    await new Promise<void>((resolve) => apiServer.listen(0, '127.0.0.1', resolve));
    const address = apiServer.address();
    apiPort = typeof address === 'object' && address ? address.port : 0;

    originalGlobalAgentCa = https.globalAgent.options.ca;
    https.globalAgent.options.ca = [caPem];
  });

  afterEach(async () => {
    https.globalAgent.options.ca = originalGlobalAgentCa;
    await proxy?.close().catch(() => undefined);
    proxy = undefined;
    await new Promise((resolve) => apiServer.close(resolve));
    await rm(dir, { recursive: true, force: true });
  });

  /** Opens a CONNECT tunnel to the proxy, then speaks TLS + HTTP over it by hand (no proxy-aware HTTP client). */
  function requestOverConnectTunnel(
    proxyPort: number,
    targetHost: string,
    targetPort: number,
    path: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = net.connect(proxyPort, '127.0.0.1', () => {
        socket.write(`CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\nHost: ${targetHost}:${targetPort}\r\n\r\n`);
      });
      socket.once('data', (connectResponse) => {
        if (!connectResponse.toString('utf8').startsWith('HTTP/1.1 200')) {
          reject(new Error(`CONNECT failed: ${connectResponse.toString('utf8')}`));
          return;
        }
        // host (not servername) drives hostname verification here - servername is SNI, which Node
        // deprecates for IP literals since RFC 6066 disallows them
        const tlsSocket = tls.connect({ socket, host: targetHost, ca: [caPem] }, () => {
          tlsSocket.write(`GET ${path} HTTP/1.1\r\nHost: ${targetHost}\r\nConnection: close\r\n\r\n`);
        });
        const chunks: Buffer[] = [];
        tlsSocket.on('data', (chunk) => chunks.push(chunk));
        tlsSocket.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        tlsSocket.on('error', reject);
      });
      socket.on('error', reject);
    });
  }

  it('terminates TLS with a leaf cert the client trusts via our CA, and forwards the decrypted request', async () => {
    const ca = await loadOrCreateCA(join(dir, 'ca'));
    const config = mergeConfig({ hosts: ['127.0.0.1'] });
    proxy = await startProxyServer({ mode: 'record', config, harPath, ca, knownSecrets: {} });

    const rawResponse = await requestOverConnectTunnel(proxy.port, '127.0.0.1', apiPort, '/v1/status');

    expect(rawResponse).toContain('HTTP/1.1 200');
    expect(rawResponse).toContain('"ok":true');
    expect(proxy.stats.recorded).toBe(1);
  });
});
