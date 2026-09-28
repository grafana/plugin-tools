import { promises as fs } from 'fs';
import { PRESETS, type Preset, type ProxyConfig } from './types.js';

/** What proxy.json may contain: any config field, plus an optional preset. */
export type ConfigFile = Partial<ProxyConfig> & { preset?: Preset };

type ListField = 'keepHeaders' | 'ignoreFields' | 'learnSecretFields' | 'credentialParams';

/** Vendor conventions, kept out of the defaults. Added on top of the defaults or your own lists. */
const PRESET_ADDITIONS: Record<Preset, Partial<Record<ListField, string[]>>> = {
  aws: {
    // AWS JSON-protocol APIs POST every operation to "/" and name it only in this header
    keepHeaders: ['x-amz-target'],
    // idempotency tokens the AWS SDK fills with a fresh UUID on every call
    ignoreFields: ['ClientToken', 'ClientRequestToken', 'IdempotencyToken'],
    learnSecretFields: ['SecretAccessKey', 'SessionToken'],
    credentialParams: ['x-amz-credential', 'x-amz-security-token', 'x-amz-signature'],
  },
};

export function defaultConfig(): ProxyConfig {
  return {
    hosts: [],
    keepHeaders: ['content-type', 'accept'],
    keepResponseHeaders: ['content-type'],
    ignoreFields: [],
    ignoreQueryParams: [],
    credentialParams: [
      'access_token',
      'api-key',
      'api_key',
      'apikey',
      // OAuth: a signed JWT (Google service accounts) that can be exchanged for an access token until it expires
      'assertion',
      'client_assertion',
      'client_secret',
      'key',
      'password',
      'refresh_token',
      'sig',
      'signature',
      'token',
    ],
    ignoreBodyFor: [],
    redactFields: ['password'],
    fakeFields: {},
    secretEnvVars: [],
    learnSecretFields: ['access_token', 'client_secret', 'id_token', 'password', 'refresh_token', 'session_token'],
  };
}

/**
 * Merges a partial config over the defaults. A field you set replaces its default, then a preset's
 * values are added to whatever is there.
 */
export function mergeConfig(partial: ConfigFile): ProxyConfig {
  const { preset, ...fields } = partial;
  const merged: ProxyConfig = { ...defaultConfig(), ...fields };
  if (preset) {
    for (const [field, additions] of Object.entries(PRESET_ADDITIONS[preset]) as Array<[ListField, string[]]>) {
      merged[field] = [...new Set([...merged[field], ...additions])];
    }
  }
  return merged;
}

export async function loadConfig(filePath: string): Promise<ProxyConfig> {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  validateConfig(parsed);
  return mergeConfig(parsed);
}

function validateConfig(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new Error('proxy.json must contain a JSON object');
  }
  const obj = value as Record<string, unknown>;
  const stringArrayFields = [
    'hosts',
    'keepHeaders',
    'keepResponseHeaders',
    'ignoreFields',
    'ignoreQueryParams',
    'credentialParams',
    'ignoreBodyFor',
    'redactFields',
    'secretEnvVars',
    'learnSecretFields',
  ];
  for (const field of stringArrayFields) {
    if (field in obj && !isStringArray(obj[field])) {
      throw new Error(`proxy.json: "${field}" must be an array of strings`);
    }
  }
  if ('preset' in obj && !PRESETS.includes(obj.preset as Preset)) {
    throw new Error(`proxy.json: "preset" must be one of ${PRESETS.join(', ')}`);
  }
  if ('fakeFields' in obj) {
    const fakeFields = obj.fakeFields;
    if (typeof fakeFields !== 'object' || fakeFields === null || Array.isArray(fakeFields)) {
      throw new Error('proxy.json: "fakeFields" must be an object mapping a JSON path to a fake kind');
    }
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/** Matches a request host against the config's `hosts` list. Supports a leading `*.` wildcard. */
export function hostIsRecorded(host: string, config: ProxyConfig): boolean {
  return config.hosts.some((pattern) => {
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1); // ".example.com"
      return host === pattern.slice(2) || host.endsWith(suffix);
    }
    return host === pattern;
  });
}
