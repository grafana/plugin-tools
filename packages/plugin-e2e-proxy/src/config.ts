import { promises as fs } from 'fs';
import type { ProxyConfig } from './types.js';

export function defaultConfig(): ProxyConfig {
  return {
    hosts: [],
    keepHeaders: ['content-type', 'accept'],
    keepResponseHeaders: ['content-type'],
    ignoreFields: [],
    ignoreQueryParams: [],
    ignoreBodyFor: [],
    redactFields: ['password'],
    fakeFields: {},
    secretEnvVars: [],
    learnSecretFields: [
      'access_token',
      'client_secret',
      'id_token',
      'password',
      'refresh_token',
      'session_token',
      'SecretAccessKey',
      'SessionToken',
    ],
  };
}

/** Merges a partial config over the defaults. Arrays and the fakeFields map replace, they don't concatenate. */
export function mergeConfig(partial: Partial<ProxyConfig>): ProxyConfig {
  return { ...defaultConfig(), ...partial };
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
