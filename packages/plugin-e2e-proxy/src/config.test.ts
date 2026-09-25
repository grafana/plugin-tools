import { describe, expect, it } from 'vitest';
import { defaultConfig, hostIsRecorded, mergeConfig } from './config.js';

describe('mergeConfig', () => {
  it('fills in defaults for anything left out of the partial config', () => {
    const config = mergeConfig({ hosts: ['api.example.com'] });
    expect(config.hosts).toEqual(['api.example.com']);
    expect(config.keepHeaders).toEqual(defaultConfig().keepHeaders);
  });
});

describe('hostIsRecorded', () => {
  it('matches an exact host', () => {
    const config = mergeConfig({ hosts: ['api.example.com'] });
    expect(hostIsRecorded('api.example.com', config)).toBe(true);
    expect(hostIsRecorded('other.example.com', config)).toBe(false);
  });

  it('matches a leading *. wildcard against the bare domain and any subdomain', () => {
    const config = mergeConfig({ hosts: ['*.amazonaws.com'] });
    expect(hostIsRecorded('redshift-data.us-east-2.amazonaws.com', config)).toBe(true);
    expect(hostIsRecorded('amazonaws.com', config)).toBe(true);
    expect(hostIsRecorded('notamazonaws.com', config)).toBe(false);
  });
});
