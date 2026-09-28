import http from 'node:http';
import net from 'node:net';
import tls from 'node:tls';
import { hostIsRecorded } from './config.js';
import { emptyHar, readHar, ReplayStore, toHarEntry, writeHar } from './har.js';
import { captureRequest, forwardRequest, sendJson, sendResponse } from './httpUtil.js';
import { sanitizeForRecording, sanitizeRequest } from './pipeline.js';
import { FakeValueStore, SecretScrubber } from './redact.js';
import { scanHar } from './scan.js';
import { CertificateStore, type CertKeyPair } from './tls.js';
import type { CapturedRequest, Har, HarEntry, Miss, ProxyConfig, ProxyMode, ProxyStats, SaveSummary } from './types.js';

export interface ProxyServerOptions {
  mode: ProxyMode;
  config: ProxyConfig;
  harPath: string;
  ca: CertKeyPair;
  knownSecrets: Record<string, string>;
  port?: number;
}

export interface ProxyServerHandle {
  port: number;
  stats: ProxyStats;
  misses: Miss[];
  /** Stops the server. In record mode, scans and writes the recorded HAR file and returns a summary. */
  close(): Promise<SaveSummary | undefined>;
}

/** A socket that has already been TLS-terminated for a specific host, carried alongside it for the shared request handler. */
interface SocketWithOrigin extends net.Socket {
  __forcedOrigin?: string;
}

export async function startProxyServer(options: ProxyServerOptions): Promise<ProxyServerHandle> {
  const { mode, config, harPath } = options;
  const certStore = new CertificateStore(options.ca);
  const scrubber = new SecretScrubber(options.knownSecrets);
  const fakeStore = new FakeValueStore();
  const scrubCounts: Record<string, number> = {};

  const stats: ProxyStats = { matched: 0, missed: 0, recorded: 0, passthrough: 0 };
  const misses: Miss[] = [];
  const recordedEntries: HarEntry[] = [];

  let replayStore: ReplayStore | undefined;
  if (mode === 'replay') {
    const har = await readHar(harPath);
    replayStore = new ReplayStore(har, config);
  }

  async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const forcedOrigin = (req.socket as SocketWithOrigin).__forcedOrigin;
      const captured = await captureRequest(req, forcedOrigin);
      const host = new URL(captured.url).hostname;

      if (!hostIsRecorded(host, config)) {
        const upstream = await forwardRequest(captured);
        stats.passthrough++;
        sendResponse(res, upstream);
        return;
      }

      if (mode === 'replay') {
        handleReplay(captured, res, replayStore!, config, scrubber, stats, misses);
        return;
      }

      await handleRecord(captured, res, config, scrubber, fakeStore, scrubCounts, stats, recordedEntries);
    } catch (err) {
      sendJson(res, 502, { error: 'plugin-e2e-proxy internal error', message: (err as Error).message });
    }
  }

  const server = http.createServer((req, res) => void handleRequest(req, res));

  // CONNECT tunnels are detached from the http server, so server.close() alone waits until clients drop them
  const openSockets = new Set<net.Socket>();
  const track = (socket: net.Socket): void => {
    openSockets.add(socket);
    socket.once('close', () => openSockets.delete(socket));
  };
  server.on('connection', track);

  server.on('connect', (req, clientSocket, head) => {
    void handleConnect(req, clientSocket as net.Socket, head, config, certStore, server, track).catch(() => {
      clientSocket.destroy();
    });
  });

  const port = await listen(server, options.port ?? 0);

  return {
    port,
    stats,
    misses,
    async close() {
      const closed = new Promise<void>((resolve) => server.close(() => resolve()));
      openSockets.forEach((socket) => socket.destroy());
      await closed;
      if (mode !== 'record') {
        return undefined;
      }
      return finalizeRecording(harPath, recordedEntries, config, scrubber, scrubCounts);
    },
  };
}

function handleReplay(
  captured: CapturedRequest,
  res: http.ServerResponse,
  replayStore: ReplayStore,
  config: ProxyConfig,
  scrubber: SecretScrubber,
  stats: ProxyStats,
  misses: Miss[]
): void {
  // recordings were keyed on sanitized requests, so the live one has to be sanitized the same way
  const request = sanitizeRequest(captured, config, scrubber, {});
  const entry = replayStore.next(request, config);
  if (!entry) {
    stats.missed++;
    const closest = replayStore.closestMatch(request, config);
    const miss: Miss = { method: request.method, url: request.url, closest };
    misses.push(miss);
    // 501, not 502: AWS and other SDKs retry 502s with backoff, which only delays the failure
    sendJson(res, 501, {
      error: 'no recording',
      method: request.method,
      url: request.url,
      hint: 'run the record command to update e2e/recordings',
      closest,
    });
    return;
  }
  stats.matched++;
  sendResponse(res, {
    status: entry.response.status,
    statusText: entry.response.statusText,
    headers: Object.fromEntries(entry.response.headers.map((h) => [h.name, h.value])),
    body: Buffer.from(entry.response.content.text, entry.response.content.encoding ?? 'utf8'),
  });
}

async function handleRecord(
  captured: CapturedRequest,
  res: http.ServerResponse,
  config: ProxyConfig,
  scrubber: SecretScrubber,
  fakeStore: FakeValueStore,
  scrubCounts: Record<string, number>,
  stats: ProxyStats,
  recordedEntries: HarEntry[]
): Promise<void> {
  const startedAt = new Date();
  const upstream = await forwardRequest(captured);
  const durationMs = Date.now() - startedAt.getTime();

  const sanitized = sanitizeForRecording(captured, upstream, config, scrubber, fakeStore, scrubCounts);
  recordedEntries.push(toHarEntry(sanitized.req, sanitized.res, startedAt, durationMs));
  stats.recorded++;

  // the plugin gets the real, unsanitized response - only the recording on disk is sanitized
  sendResponse(res, upstream);
}

async function finalizeRecording(
  harPath: string,
  recordedEntries: HarEntry[],
  config: ProxyConfig,
  scrubber: SecretScrubber,
  scrubbed: Record<string, number>
): Promise<SaveSummary> {
  const har: Har = { ...emptyHar(), log: { ...emptyHar().log, entries: recordedEntries } };
  const findings = scanHar(har, harPath, scrubber);

  if (findings.length > 0) {
    // still written to disk, under a name that never gets picked up as a real recording - a
    // "refuses to write" that leaves nothing to inspect just makes the finding unactionable
    const quarantinePath = `${harPath}.quarantine.json`;
    await writeHar(quarantinePath, har, config);
    return { files: [], entries: recordedEntries.length, scrubbed, findings, quarantined: [quarantinePath] };
  }

  await writeHar(harPath, har, config);
  return { files: [harPath], entries: recordedEntries.length, scrubbed, findings: [], quarantined: [] };
}

async function handleConnect(
  req: http.IncomingMessage,
  clientSocket: net.Socket,
  head: Buffer,
  config: ProxyConfig,
  certStore: CertificateStore,
  server: http.Server,
  track: (socket: net.Socket) => void
): Promise<void> {
  const [targetHost, targetPortRaw] = (req.url ?? '').split(':');
  const targetPort = Number(targetPortRaw || 443);

  if (!hostIsRecorded(targetHost, config)) {
    return passthroughTunnel(clientSocket, targetHost, targetPort, head, track);
  }

  clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
  const { certPem, keyPem } = certStore.forHost(targetHost);

  const tlsSocket = new tls.TLSSocket(clientSocket, {
    isServer: true,
    cert: certPem,
    key: keyPem,
  }) as SocketWithOrigin;

  tlsSocket.__forcedOrigin = `https://${targetHost}:${targetPort}`;
  tlsSocket.on('error', () => clientSocket.destroy());

  // feeds the decrypted HTTP traffic into the same request handler used for plain HTTP proxying
  server.emit('connection', tlsSocket);
}

function passthroughTunnel(
  clientSocket: net.Socket,
  host: string,
  port: number,
  head: Buffer,
  track: (socket: net.Socket) => void
): void {
  const serverSocket = net.connect(port, host, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    if (head.length > 0) {
      serverSocket.write(head);
    }
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });
  track(serverSocket);
  serverSocket.on('error', () => clientSocket.destroy());
  serverSocket.on('close', () => clientSocket.destroy());
  clientSocket.on('error', () => serverSocket.destroy());
  clientSocket.on('close', () => serverSocket.destroy());
}

function listen(server: http.Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      const address = server.address();
      resolve(typeof address === 'object' && address ? address.port : port);
    });
  });
}
