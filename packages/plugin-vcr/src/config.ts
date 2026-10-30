import { promises as fs } from 'fs';
import { FAKE_KINDS, PRESETS, type Preset, type ProxyConfig } from './types.js';

/** What the config file may contain: any config field, plus an optional preset. */
export type ConfigFile = Partial<ProxyConfig> & { preset?: Preset };

type ListField = 'keepHeaders' | 'ignoreFields' | 'learnSecretFields' | 'credentialParams';

const KNOWN_KEYS = [
  'hosts',
  'keepHeaders',
  'keepResponseHeaders',
  'ignoreFields',
  'ignoreQueryParams',
  'credentialParams',
  'ignoreBodyFor',
  'redactFields',
  'fakeFields',
  'secretEnvVars',
  'learnSecretFields',
  'preset',
];

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

/** Header names in the config are matched case-insensitively; store them lowercased once, up front. */
const HEADER_FIELDS = ['keepHeaders', 'keepResponseHeaders'] as const;

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
  for (const field of HEADER_FIELDS) {
    merged[field] = merged[field].map((name) => name.toLowerCase());
  }
  return merged;
}

export async function loadConfig(filePath: string): Promise<ProxyConfig> {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  validateConfig(parsed, filePath);
  return mergeConfig(parsed);
}

export function validateConfig(value: unknown, filePath: string): void {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${filePath} must contain a JSON object`);
  }
  const obj = value as Record<string, unknown>;

  const unknownKeys = Object.keys(obj).filter((key) => !KNOWN_KEYS.includes(key));
  if (unknownKeys.length > 0) {
    throw new Error(
      `${filePath}: unknown field(s) ${unknownKeys.join(', ')} - typo? valid fields are ${KNOWN_KEYS.join(', ')}`
    );
  }

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
      throw new Error(`${filePath}: "${field}" must be an array of strings`);
    }
  }
  if ('preset' in obj && !PRESETS.includes(obj.preset as Preset)) {
    throw new Error(`${filePath}: "preset" must be one of ${PRESETS.join(', ')}`);
  }
  if ('fakeFields' in obj) {
    const fakeFields = obj.fakeFields;
    if (typeof fakeFields !== 'object' || fakeFields === null || Array.isArray(fakeFields)) {
      throw new Error(`${filePath}: "fakeFields" must be an object mapping a JSON path to a fake kind`);
    }
    for (const [path, kind] of Object.entries(fakeFields as Record<string, unknown>)) {
      if (!FAKE_KINDS.includes(kind as (typeof FAKE_KINDS)[number])) {
        throw new Error(`${filePath}: "fakeFields.${path}" must be one of ${FAKE_KINDS.join(', ')}, got "${kind}"`);
      }
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
