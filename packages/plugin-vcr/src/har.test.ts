import { describe, expect, it } from 'vitest';
import { mergeConfig } from './config.js';
import { emptyHar, harEntryToCaptured, ReplayStore, toHarEntry } from './har.js';
import { sanitizeForRecording, sanitizeRequest } from './pipeline.js';
import { FakeValueStore, SecretScrubber } from './redact.js';
import type { CapturedRequest, CapturedResponse } from './types.js';

function req(url = 'https://api.example.com/v1/status'): CapturedRequest {
  return { method: 'GET', url, headers: {}, body: Buffer.from('') };
}

function res(body: string): CapturedResponse {
  return { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' }, body: Buffer.from(body) };
}

describe('ReplayStore', () => {
  it('returns undefined (a miss) for a request with no recording', () => {
    const har = emptyHar();
    const store = new ReplayStore(har, mergeConfig({}));
    expect(store.next(req(), mergeConfig({}))).toBeUndefined();
  });

  it('replays two identical requests in the order they were recorded', () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res('{"state":"running"}'), new Date(), 1));
    har.log.entries.push(toHarEntry(req(), res('{"state":"succeeded"}'), new Date(), 1));
    const config = mergeConfig({});
    const store = new ReplayStore(har, config);

    expect(store.next(req(), config)?.response.content.text).toBe('{"state":"running"}');
    expect(store.next(req(), config)?.response.content.text).toBe('{"state":"succeeded"}');
  });

  it('repeats the last response once the recorded sequence is exhausted', () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res('{"state":"running"}'), new Date(), 1));
    har.log.entries.push(toHarEntry(req(), res('{"state":"succeeded"}'), new Date(), 1));
    const config = mergeConfig({});
    const store = new ReplayStore(har, config);

    store.next(req(), config);
    store.next(req(), config);
    expect(store.next(req(), config)?.response.content.text).toBe('{"state":"succeeded"}');
    expect(store.next(req(), config)?.response.content.text).toBe('{"state":"succeeded"}');
  });
});

describe('ReplayStore.closestMatch', () => {
  it('finds a recorded request with the same method/host/path and reports what differs', () => {
    const har = emptyHar();
    const recorded: CapturedRequest = {
      method: 'POST',
      url: 'https://api.example.com/v1/query',
      headers: { 'content-type': 'application/json' },
      body: Buffer.from(JSON.stringify({ query: 'select 1' })),
    };
    har.log.entries.push(toHarEntry(recorded, res('{"ok":true}'), new Date(), 1));
    const config = mergeConfig({});
    const store = new ReplayStore(har, config);

    const missed: CapturedRequest = { ...recorded, body: Buffer.from(JSON.stringify({ query: 'select 2' })) };
    const closest = store.closestMatch(missed, config);

    expect(closest?.url).toBe(recorded.url);
    expect(closest?.differences).toEqual(['body field "query": got "select 2", recording has "select 1"']);
  });

  it('returns undefined when nothing with that method/host/path was ever recorded', () => {
    const har = emptyHar();
    const config = mergeConfig({});
    const store = new ReplayStore(har, config);
    expect(store.closestMatch(req(), config)).toBeUndefined();
  });
});

describe('recording then replaying through the sanitize pipeline', () => {
  it('matches a POST even when keepHeaders leaves out content-type', () => {
    const config = mergeConfig({ keepHeaders: ['x-amz-target'] });
    const post: CapturedRequest = {
      method: 'POST',
      url: 'https://redshift-data.us-east-2.amazonaws.com/',
      headers: { 'content-type': 'application/x-amz-json-1.1', 'x-amz-target': 'RedshiftData.ExecuteStatement' },
      body: Buffer.from(JSON.stringify({ Sql: 'select 1' })),
    };
    const scrubber = new SecretScrubber({});
    const sanitized = sanitizeForRecording(post, res('{"Id":"1"}'), config, scrubber, new FakeValueStore(), {});
    const har = emptyHar();
    har.log.entries.push(toHarEntry(sanitized.req, sanitized.res, new Date(), 1));

    const store = new ReplayStore(har, config);
    expect(store.next(sanitizeRequest(post, config, scrubber, {}), config)?.response.content.text).toBe('{"Id":"1"}');
  });

  it('stores a binary response as base64 and replays the same bytes', () => {
    const binary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0xff, 0xfe, 0x00]);
    const entry = toHarEntry(req(), { status: 200, statusText: 'OK', headers: {}, body: binary }, new Date(), 1);
    expect(entry.response.content.encoding).toBe('base64');
    expect(harEntryToCaptured(entry).res.body.equals(binary)).toBe(true);
  });
});
