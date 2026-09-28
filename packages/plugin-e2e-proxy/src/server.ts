import { promises as fs } from 'fs';
import http from 'node:http';
import net from 'node:net';
import tls from 'node:tls';
import { hostIsRecorded } from './config.js';
import { Correlator } from './correlation.js';
import { emptyHar, harEntryToCaptured, readHar, ReplayStore, toHarEntry, writeHar } from './har.js';
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
  /** How long record mode waits after the last new entry before writing the recording. */
  flushDelayMs?: number;
  /** One line per recorded entry and per replay miss. */
  log?: (line: string) => void;
}

export interface ProxyServerHandle {
  port: number;
  stats: ProxyStats;
  misses: Miss[];
  /** Hosts traffic went to without being recorded, in first-seen order, to help fill in `hosts`. */
  passthroughHosts: string[];
  /** Stops the server. In record mode, writes any entries not yet on disk and returns a summary. */
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
  const log = options.log ?? (() => undefined);
  const correlator = new Correlator();

  // written shortly after each new entry, not only on shutdown, so a SIGKILL loses at most the last moments
  const flushDelayMs = options.flushDelayMs ?? 500;
  const recordingState = { wroteHar: false };
  let flushTimer: NodeJS.Timeout | undefined;
  let lastWrite: Promise<SaveSummary> | undefined;
  const flush = (): Promise<SaveSummary> => {
    clearTimeout(flushTimer);
    flushTimer = undefined;
    // chained, so two flushes never write the same file at once, and a failed one doesn't block the next
    const previous = lastWrite?.catch(() => undefined) ?? Promise.resolve();
    lastWrite = previous.then(() =>
      finalizeRecording(harPath, recordedEntries, config, scrubber, scrubCounts, recordingState)
    );
    return lastWrite;
  };
  const scheduleFlush = (): void => {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
      flush().catch((err: Error) => log(`failed to write ${harPath}: ${err.message}`));
    }, flushDelayMs);
  };

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
        notePassthrough(host);
        const upstream = await forwardRequest(captured);
        sendResponse(res, upstream);
        return;
      }

      if (mode === 'replay') {
        handleReplay(captured, res, replayStore!, correlator, config, scrubber, stats, misses, log);
        return;
      }

      await handleRecord(captured, res, config, scrubber, fakeStore, scrubCounts, stats, recordedEntries, log);
      scheduleFlush();
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

  const passthroughHosts: string[] = [];
  function notePassthrough(host: string): void {
    stats.passthrough++;
    if (!passthroughHosts.includes(host)) {
      passthroughHosts.push(host);
      log(`passthrough ${host} - not recorded, add it to "hosts" in proxy.json if the plugin calls it`);
    }
  }

  server.on('connect', (req, clientSocket, head) => {
    void handleConnect(req, clientSocket as net.Socket, head, config, certStore, server, track, notePassthrough).catch(
      () => {
        clientSocket.destroy();
      }
    );
  });

  const port = await listen(server, options.port ?? 0);

  return {
    port,
    stats,
    misses,
    passthroughHosts,
    async close() {
      const closed = new Promise<void>((resolve) => server.close(() => resolve()));
      openSockets.forEach((socket) => socket.destroy());
      await closed;
      if (mode !== 'record') {
        return undefined;
      }
      return flush();
    },
  };
}

function handleReplay(
  captured: CapturedRequest,
  res: http.ServerResponse,
  replayStore: ReplayStore,
  correlator: Correlator,
  config: ProxyConfig,
  scrubber: SecretScrubber,
  stats: ProxyStats,
  misses: Miss[],
  log: (line: string) => void
): void {
  // recordings were keyed on sanitized requests, so the live one has to be sanitized the same way
  const request = correlator.rewrite(sanitizeRequest(captured, config, scrubber, {}));
  const entry = replayStore.next(request, config);
  if (entry) {
    correlator.learn(request, harEntryToCaptured(entry).req, config);
  }
  if (!entry) {
    stats.missed++;
    const closest = replayStore.closestMatch(request, config);
    const miss: Miss = { method: request.method, url: request.url, closest };
    misses.push(miss);
    log(
      `miss ${describeRequest(request, config)}${closest ? ` - closest recording: ${closest.differences.join(', ')}` : ''}`
    );
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
  recordedEntries: HarEntry[],
  log: (line: string) => void
): Promise<void> {
  const startedAt = new Date();
  const upstream = await forwardRequest(captured);
  const durationMs = Date.now() - startedAt.getTime();

  const sanitized = sanitizeForRecording(captured, upstream, config, scrubber, fakeStore, scrubCounts);
  recordedEntries.push(toHarEntry(sanitized.req, sanitized.res, startedAt, durationMs));
  stats.recorded++;
  log(`recorded ${describeRequest(sanitized.req, config)} -> ${upstream.status}`);

  // the plugin gets the real, unsanitized response - only the recording on disk is sanitized
  sendResponse(res, upstream);
}

/**
 * Sanitized, so it's safe to log. Values of kept headers are included, since some APIs only name
 * the operation in one: "POST redshift-data.us-east-2.amazonaws.com/ RedshiftData.ExecuteStatement".
 */
function describeRequest(req: CapturedRequest, config: ProxyConfig): string {
  const url = new URL(req.url);
  const operation = config.keepHeaders
    .filter((name) => !['accept', 'content-type'].includes(name))
    .map((name) => req.headers[name])
    .filter(Boolean);
  return [`${req.method} ${url.hostname}${url.pathname}`, ...operation].join(' ');
}

async function finalizeRecording(
  harPath: string,
  recordedEntries: HarEntry[],
  config: ProxyConfig,
  scrubber: SecretScrubber,
  scrubbed: Record<string, number>,
  state: { wroteHar: boolean }
): Promise<SaveSummary> {
  const summary = { entries: recordedEntries.length, scrubbed };
  // nothing recorded (e.g. started and stopped by mistake): keep whatever recording is already there
  if (recordedEntries.length === 0) {
    return { ...summary, files: [], findings: [], quarantined: [] };
  }

  const har: Har = { ...emptyHar(), log: { ...emptyHar().log, entries: [...recordedEntries] } };
  const findings = scanHar(har, harPath, scrubber);

  if (findings.length > 0) {
    // still written to disk, under a name that never gets picked up as a real recording - a
    // "refuses to write" that leaves nothing to inspect just makes the finding unactionable
    const quarantinePath = `${harPath}.quarantine.json`;
    await writeHar(quarantinePath, har, config);
    // an earlier flush this session may have written a clean but partial recording; replaying it would hide the finding
    if (state.wroteHar) {
      await fs.rm(harPath, { force: true });
      state.wroteHar = false;
    }
    return { ...summary, files: [], findings, quarantined: [quarantinePath] };
  }

  await writeHar(harPath, har, config);
  state.wroteHar = true;
  return { ...summary, files: [harPath], findings: [], quarantined: [] };
}

async function handleConnect(
  req: http.IncomingMessage,
  clientSocket: net.Socket,
  head: Buffer,
  config: ProxyConfig,
  certStore: CertificateStore,
  server: http.Server,
  track: (socket: net.Socket) => void,
  notePassthrough: (host: string) => void
): Promise<void> {
  const [targetHost, targetPortRaw] = (req.url ?? '').split(':');
  const targetPort = Number(targetPortRaw || 443);

  if (!hostIsRecorded(targetHost, config)) {
    notePassthrough(targetHost);
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
