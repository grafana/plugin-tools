import pino from 'pino';
import { tmpdir } from 'node:os';
import path from 'node:path';

const LOGGER = 'grafana-mcp-plugin';
export const LOGFILEPATH = path.join(tmpdir(), `${LOGGER}.log`);
const fileTransport = pino.transport({ target: 'pino/file', options: { destination: LOGFILEPATH } });
const stdOutTransport = pino.transport({ target: 'pino-pretty', options: { destination: 2 } });
const baseFileLogger = pino({ formatters: { level: (level) => ({ level }) } }, fileTransport);
const baseStdOutLogger = pino({ formatters: { level: (level) => ({ level }) } }, stdOutTransport);
let fileLogger: pino.Logger | undefined;
let stdOutLogger: pino.Logger | undefined;

const UNKOWN = 'unknown';
const clientInfo = { name: UNKOWN, version: UNKOWN, protocolVersion: UNKOWN };

export function initLogger(clientName?: string, clientVersion?: string, clientProtocol?: string) {
  clientInfo.name = clientName || UNKOWN;
  clientInfo.version = clientVersion || UNKOWN;
  clientInfo.protocolVersion = clientProtocol || UNKOWN;
  stdOutLogger = baseStdOutLogger.child({ clientInfo });
  fileLogger = baseFileLogger.child({ clientInfo });
}

function debug(...args: Parameters<typeof console.debug>) {
  stdOutLogger?.debug(...args);
  fileLogger?.debug(...args);
}

function info(...args: Parameters<typeof console.info>) {
  stdOutLogger?.info(...args);
  fileLogger?.info(...args);
}

function warn(...args: Parameters<typeof console.warn>) {
  stdOutLogger?.warn(...args);
  fileLogger?.warn(...args);
}

function error(...args: Parameters<typeof console.error>) {
  stdOutLogger?.error(...args);
  fileLogger?.error(...args);
}

export const logger = {
  debug,
  info,
  warn,
  error,
};
