import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPrivateKey } from 'node:crypto';
import { parseArgs, runFields, runKeygen, runRedact, runScan } from './cli.js';
import { emptyHar, readHar, toHarEntry } from './har.js';
import type { CapturedRequest, CapturedResponse } from './types.js';

describe('parseArgs', () => {
  it('reads the command and --key value pairs', () => {
    expect(parseArgs(['serve', '--mode', 'record', '--har', 'e2e/api.har'])).toEqual({
      command: 'serve',
      options: { mode: 'record', har: 'e2e/api.har' },
    });
  });

  it('treats a flag with no following value as boolean true', () => {
    expect(parseArgs(['scan', '--verbose'])).toEqual({ command: 'scan', options: { verbose: 'true' } });
  });
});

function req(): CapturedRequest {
  return { method: 'GET', url: 'https://api.example.com/v1/items', headers: {}, body: Buffer.from('') };
}

function res(body: object): CapturedResponse {
  return {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    body: Buffer.from(JSON.stringify(body)),
  };
}

describe('CLI subcommands', () => {
  let dir: string;
  let harPath: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'plugin-vcr-cli-'));
    harPath = join(dir, 'api.har');
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    process.exitCode = undefined;
    await rm(dir, { recursive: true, force: true });
  });

  it('scan reports no findings on a clean recording and does not set an exit code', async () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res({ ok: true }), new Date(), 1));
    await writeFile(harPath, JSON.stringify(har));

    await runScan({ har: harPath });

    expect(process.exitCode).toBeUndefined();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('no findings'));
  });

  it('scan sets a non-zero exit code when it finds something', async () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res({ key: 'AKIAABCDEFGHIJKLMNOP' }), new Date(), 1));
    await writeFile(harPath, JSON.stringify(har));

    await runScan({ har: harPath });

    expect(process.exitCode).toBe(1);
  });

  it('scan also checks for values of env vars listed in secretEnvVars', async () => {
    process.env.VENDOR_API_KEY = 'vendor-key-value';
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res({ echo: 'vendor-key-value' }), new Date(), 1));
    await writeFile(harPath, JSON.stringify(har));
    const configPath = join(dir, 'vcr.json');
    await writeFile(configPath, JSON.stringify({ secretEnvVars: ['VENDOR_API_KEY'] }));

    await runScan({ har: harPath, config: configPath });

    delete process.env.VENDOR_API_KEY;
    expect(process.exitCode).toBe(1);
  });

  it('keygen writes a usable RSA key, and keeps it on a second run', async () => {
    const keyPath = join(dir, 'keys', 'dummy-key.pem');
    await runKeygen({ out: keyPath });
    const first = await readFile(keyPath, 'utf8');
    expect(createPrivateKey(first).asymmetricKeyType).toBe('rsa');

    await runKeygen({ out: keyPath });
    expect(await readFile(keyPath, 'utf8')).toBe(first);
  });

  it('keygen can wrap the key in a Google service account JSON file', async () => {
    const keyPath = join(dir, 'keys', 'service-account.json');
    await runKeygen({ out: keyPath, format: 'google-service-account' });
    const account = JSON.parse(await readFile(keyPath, 'utf8'));
    expect(account.type).toBe('service_account');
    expect(account.token_uri).toBe('https://oauth2.googleapis.com/token');
    expect(createPrivateKey(account.private_key).asymmetricKeyType).toBe('rsa');
  });

  it('fields lists distinct field paths with sample values', async () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res({ user: { email: 'a@example.com' } }), new Date(), 1));
    await writeFile(harPath, JSON.stringify(har));

    await runFields({ har: harPath });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('user.email'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('a@example.com'));
  });

  it('redact rewrites the har file using a vcr.json rule added after recording', async () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res({ user: { email: 'real@example.com' } }), new Date(), 1));
    await writeFile(harPath, JSON.stringify(har));

    const configPath = join(dir, 'vcr.json');
    await writeFile(configPath, JSON.stringify({ redactFields: ['email'] }));

    await runRedact({ har: harPath, config: configPath });

    const rewritten = await readHar(harPath);
    expect(JSON.parse(rewritten.log.entries[0].response.content.text)).toEqual({ user: { email: 'REDACTED' } });
  });

  it('redact reads secrets from provisioning and refuses to write if scanning still finds something', async () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res({ key: 'AKIAABCDEFGHIJKLMNOP' }), new Date(), 1));
    await writeFile(harPath, JSON.stringify(har));

    await expect(runRedact({ har: harPath })).rejects.toThrow(/refusing to write/);
  });
});
