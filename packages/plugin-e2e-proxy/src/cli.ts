import { generateKeyPairSync } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { defaultConfig, loadConfig } from './config.js';
import { summarizeFields } from './fields.js';
import { readHar, writeHar } from './har.js';
import { redactExistingHar } from './offlineRedact.js';
import { resolveKnownSecrets } from './provisioning.js';
import { SecretScrubber } from './redact.js';
import { scanHar } from './scan.js';
import { startProxyServer } from './server.js';
import { loadOrCreateCA } from './tls.js';
import type { ProxyMode } from './types.js';

export interface CliArgs {
  command: string;
  options: Record<string, string>;
}

const KNOWN_COMMANDS = ['serve', 'scan', 'fields', 'redact', 'keygen'];

/** A deliberately small `--key value` parser - the flag set here doesn't need a general-purpose library. */
export function parseArgs(argv: string[]): CliArgs {
  const [command, ...rest] = argv;
  const options: Record<string, string> = {};
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const next = rest[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      options[key] = next;
      i++;
    } else {
      options[key] = 'true';
    }
  }
  return { command: command ?? '', options };
}

function requireOption(options: Record<string, string>, name: string): string {
  const value = options[name];
  if (!value) {
    throw new Error(`missing required --${name}`);
  }
  return value;
}

async function loadConfigOrDefault(configPath: string | undefined): Promise<ReturnType<typeof defaultConfig>> {
  if (!configPath) {
    return defaultConfig();
  }
  return loadConfig(configPath);
}

export async function runServe(options: Record<string, string>): Promise<void> {
  const mode = requireOption(options, 'mode') as ProxyMode;
  if (mode !== 'record' && mode !== 'replay') {
    throw new Error(`--mode must be "record" or "replay", got "${mode}"`);
  }
  const harPath = requireOption(options, 'har');
  const config = await loadConfigOrDefault(options.config);
  const caDir = options['ca-dir'] ?? `${harPath}.ca`;
  const ca = await loadOrCreateCA(caDir);
  const knownSecrets = await resolveKnownSecrets(options.provisioning, config.secretEnvVars);
  const port = options.port ? Number(options.port) : 8080;

  const proxy = await startProxyServer({ mode, config, harPath, ca, caDir, knownSecrets, port, log: console.log });
  console.log(`plugin-e2e-proxy listening on :${proxy.port} in ${mode} mode, CA at ${caDir}/ca.pem`);

  const shutdown = async (): Promise<void> => {
    const summary = await proxy.close();
    if (summary) {
      if (summary.findings.length > 0) {
        console.error(
          `refused to write ${harPath}: ${summary.findings.length} finding(s), quarantined at ${summary.quarantined.join(', ')}`
        );
        process.exitCode = 1;
      } else if (summary.files.length === 0) {
        console.log(`nothing recorded, left ${harPath} as it was`);
      } else {
        console.log(`wrote ${summary.entries} entr${summary.entries === 1 ? 'y' : 'ies'} to ${harPath}`);
      }
      const scrubbed = Object.entries(summary.scrubbed).map(([label, count]) => `${label} x${count}`);
      console.log(`scrubbed: ${scrubbed.length > 0 ? scrubbed.join(', ') : 'nothing'}`);
    }
    console.log(
      `matched=${proxy.stats.matched} missed=${proxy.stats.missed} recorded=${proxy.stats.recorded} passthrough=${proxy.stats.passthrough}`
    );
    if (proxy.passthroughHosts.length > 0) {
      console.log(`passed through without recording: ${proxy.passthroughHosts.join(', ')}`);
    }
    if (proxy.stats.missed > 0) {
      process.exitCode = 1;
    }
  };

  process.once('SIGINT', () => void shutdown().then(() => process.exit()));
  process.once('SIGTERM', () => void shutdown().then(() => process.exit()));
}

export async function runScan(options: Record<string, string>): Promise<void> {
  const harPath = requireOption(options, 'har');
  const config = await loadConfigOrDefault(options.config);
  const knownSecrets = await resolveKnownSecrets(options.provisioning, config.secretEnvVars);
  const har = await readHar(harPath);
  const findings = scanHar(har, harPath, new SecretScrubber(knownSecrets));

  if (findings.length === 0) {
    console.log(`${harPath}: no findings`);
    return;
  }
  for (const finding of findings) {
    console.log(`${finding.file} entry ${finding.entry} [${finding.location}] ${finding.rule}: ${finding.preview}`);
  }
  process.exitCode = 1;
}

export async function runFields(options: Record<string, string>): Promise<void> {
  const harPath = requireOption(options, 'har');
  const har = await readHar(harPath);
  const fields = summarizeFields(har);
  for (const field of fields) {
    console.log(`${field.path}\t${field.samples.join(', ')}`);
  }
}

export async function runRedact(options: Record<string, string>): Promise<void> {
  const harPath = requireOption(options, 'har');
  const config = await loadConfigOrDefault(options.config);
  const knownSecrets = await resolveKnownSecrets(options.provisioning, config.secretEnvVars);
  const har = await readHar(harPath);
  const redacted = redactExistingHar(har, config, knownSecrets);

  const findings = scanHar(redacted, harPath, new SecretScrubber(knownSecrets));
  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(`${finding.file} entry ${finding.entry} [${finding.location}] ${finding.rule}: ${finding.preview}`);
    }
    throw new Error(`refusing to write ${harPath}: ${findings.length} finding(s) remain after redaction`);
  }

  await writeHar(harPath, redacted, config);
  console.log(`rewrote ${redacted.log.entries.length} entries in ${harPath}`);
}

const KEYGEN_FORMATS = ['pem', 'google-service-account'];

/**
 * Writes a throwaway RSA private key, for plugins whose auth signs requests locally (e.g. a Google
 * service account JWT). Replay needs a key that can sign, but never one with real access, and
 * generating it means no key file is ever committed. Keeps an existing file unless --force is set.
 *
 * `--format google-service-account` wraps the key in a service account JSON file. The token URI
 * must match the recording (default https://oauth2.googleapis.com/token); the email doesn't
 * matter, since the signed assertion carrying it is redacted from recordings.
 */
export async function runKeygen(options: Record<string, string>): Promise<void> {
  const outPath = requireOption(options, 'out');
  const format = options.format ?? 'pem';
  if (!KEYGEN_FORMATS.includes(format)) {
    throw new Error(`--format must be one of ${KEYGEN_FORMATS.join(', ')}, got "${format}"`);
  }
  const exists = await fs.access(outPath).then(
    () => true,
    () => false
  );
  if (exists && options.force !== 'true') {
    console.log(`kept existing key at ${outPath}`);
    return;
  }
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const contents =
    format === 'pem'
      ? pem
      : JSON.stringify(
          {
            type: 'service_account',
            project_id: options.project ?? 'e2e-replay',
            private_key_id: 'e2e-replay',
            private_key: pem,
            client_email: options['client-email'] ?? 'e2e-replay@e2e-replay.iam.gserviceaccount.com',
            token_uri: options['token-uri'] ?? 'https://oauth2.googleapis.com/token',
          },
          null,
          2
        );
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, contents, { mode: 0o600 });
  console.log(`wrote a throwaway ${format} key to ${outPath}`);
}

export async function main(argv: string[]): Promise<void> {
  const { command, options } = parseArgs(argv);
  if (!KNOWN_COMMANDS.includes(command)) {
    throw new Error(`usage: plugin-e2e-proxy <${KNOWN_COMMANDS.join('|')}> [--flags]`);
  }
  const handlers: Record<string, (options: Record<string, string>) => Promise<void>> = {
    serve: runServe,
    scan: runScan,
    fields: runFields,
    redact: runRedact,
    keygen: runKeygen,
  };
  await handlers[command](options);
}
