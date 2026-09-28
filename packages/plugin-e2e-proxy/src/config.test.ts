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

describe('presets', () => {
  it('adds the aws preset on top of the defaults', () => {
    const config = mergeConfig({ preset: 'aws' });
    expect(config.keepHeaders).toEqual(['content-type', 'accept', 'x-amz-target']);
    expect(config.ignoreFields).toContain('ClientToken');
  });

  it('adds the aws preset on top of lists you set yourself, instead of being replaced by them', () => {
    const config = mergeConfig({ preset: 'aws', keepHeaders: ['content-type'], ignoreFields: ['requestId'] });
    expect(config.keepHeaders).toEqual(['content-type', 'x-amz-target']);
    expect(config.ignoreFields).toEqual(['requestId', 'ClientToken', 'ClientRequestToken', 'IdempotencyToken']);
  });

  it('keeps AWS names out of the defaults', () => {
    const defaults = JSON.stringify(defaultConfig());
    expect(defaults).not.toMatch(/amz|SecretAccessKey|SessionToken|ClientToken/i);
  });
});
