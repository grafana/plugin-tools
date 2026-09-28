import { describe, expect, it } from 'vitest';
import { mergeConfig } from './config.js';
import { Correlator } from './correlation.js';
import { emptyHar, harEntryToCaptured, ReplayStore, toHarEntry } from './har.js';
import type { CapturedRequest, CapturedResponse } from './types.js';

const base = 'https://bigquery.googleapis.com/bigquery/v2/projects/p';
const insert = (jobId: string): CapturedRequest => ({
  method: 'POST',
  url: `${base}/jobs`,
  headers: { 'content-type': 'application/json' },
  body: Buffer.from(JSON.stringify({ jobReference: { jobId }, configuration: { query: { query: 'select 1' } } })),
});
const results = (jobId: string): CapturedRequest => ({
  method: 'GET',
  url: `${base}/queries/${jobId}`,
  headers: {},
  body: Buffer.from(''),
});
const res = (body: object): CapturedResponse => ({
  status: 200,
  statusText: 'OK',
  headers: { 'content-type': 'application/json' },
  body: Buffer.from(JSON.stringify(body)),
});

describe('Correlator (a client-generated ID reused in a later URL, as BigQuery does)', () => {
  const config = mergeConfig({ ignoreFields: ['jobId'] });

  function recording() {
    const har = emptyHar();
    har.log.entries.push(
      toHarEntry(insert('job_recorded_0001'), res({ jobReference: { jobId: 'job_recorded_0001' } }), new Date(0), 1)
    );
    har.log.entries.push(
      toHarEntry(results('job_recorded_0001'), res({ rows: [{ f: [{ v: '1' }] }] }), new Date(1000), 1)
    );
    return har;
  }

  function replay(store: ReplayStore, correlator: Correlator | undefined, req: CapturedRequest) {
    const rewritten = correlator ? correlator.rewrite(req) : req;
    const entry = store.next(rewritten, config);
    if (entry && correlator) {
      correlator.learn(rewritten, harEntryToCaptured(entry).req, config);
    }
    return entry;
  }

  it('matches the follow-up by swapping the live ID for the recorded one', () => {
    const store = new ReplayStore(recording(), config);
    const correlator = new Correlator();
    expect(replay(store, correlator, insert('job_live_0002'))).toBeDefined();
    expect(replay(store, correlator, results('job_live_0002'))?.response.content.text).toContain('rows');
  });

  it('misses the follow-up without it', () => {
    const store = new ReplayStore(recording(), config);
    expect(replay(store, undefined, insert('job_live_0002'))).toBeDefined();
    expect(replay(store, undefined, results('job_live_0002'))).toBeUndefined();
  });

  it('ignores short values, which are too likely to collide with unrelated text', () => {
    const correlator = new Correlator();
    correlator.learn(insert('abc'), insert('xyz'), config);
    expect(correlator.rewrite(results('abc')).url).toBe(`${base}/queries/abc`);
  });
});
