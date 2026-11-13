import { describe, expect, it } from 'vitest';
import { mergeConfig } from './config.js';
import { describeDifferences } from './differences.js';
import { emptyHar, ReplayStore, toHarEntry } from './har.js';
import { buildMatchKey } from './match.js';
import type { CapturedRequest, CapturedResponse } from './types.js';

function req(overrides: Partial<CapturedRequest>): CapturedRequest {
  return {
    method: 'POST',
    url: 'https://api.example.com/v1/query',
    headers: { 'content-type': 'application/json' },
    body: Buffer.from(''),
    ...overrides,
  };
}

const json = (value: object): Buffer => Buffer.from(JSON.stringify(value));
const config = mergeConfig({ keepHeaders: ['content-type', 'x-amz-target'] });
const diff = (current: CapturedRequest, recorded: CapturedRequest): string[] =>
  describeDifferences(buildMatchKey(current, config), buildMatchKey(recorded, config));

describe('describeDifferences', () => {
  it('names the body field that differs', () => {
    expect(
      diff(
        req({ body: json({ Sql: 'select 2', Database: 'dev' }) }),
        req({ body: json({ Sql: 'select 1', Database: 'dev' }) })
      )
    ).toEqual(['body field "Sql": got "select 2", recording has "select 1"']);
  });

  it('suggests ignoreFields for a field that looks generated per request', () => {
    const [difference] = diff(
      req({ body: json({ ClientToken: '5f0c8a1e-2b3d-4c5e-8f9a-0b1c2d3e4f5a' }) }),
      req({ body: json({ ClientToken: '9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d' }) })
    );
    expect(difference).toContain('add it to ignoreFields');
  });

  it('suggests pinning the time range for a time value', () => {
    const [difference] = diff(
      req({ body: json({ from: '1759050000000' }) }),
      req({ body: json({ from: '1759046400000' }) })
    );
    expect(difference).toContain("pin the test's time range");
  });

  it('shows where a long value differs, e.g. a timestamp deep inside a SQL string', () => {
    const sql = (time: string) =>
      `select saletime as time, commission from sales where saletime BETWEEN '${time}' AND '2008-01-02T19:00:00Z' order by 1`;
    const [difference] = diff(
      req({ body: json({ Sql: sql('2026-09-28T09:00:00Z') }) }),
      req({ body: json({ Sql: sql('2008-01-01T19:00:00Z') }) })
    );
    expect(difference).toContain("BETWEEN '2026-09-28");
    expect(difference).toContain("BETWEEN '2008-01-01");
  });

  it('names query params and headers that differ', () => {
    expect(
      diff(
        req({
          url: 'https://api.example.com/v1/query?page=2',
          headers: { 'content-type': 'application/json', 'x-amz-target': 'A.Describe' },
        }),
        req({
          url: 'https://api.example.com/v1/query?page=1',
          headers: { 'content-type': 'application/json', 'x-amz-target': 'A.Execute' },
        })
      )
    ).toEqual([
      'query param "page": got "2", recording has "1"',
      'header "x-amz-target": got "A.Describe", recording has "A.Execute"',
    ]);
  });

  it('caps the list and says how many more there are', () => {
    const many = (n: number) => Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`f${i}`, n]));
    const differences = diff(req({ body: json(many(1)) }), req({ body: json(many(2)) }));
    expect(differences).toHaveLength(6);
    expect(differences[5]).toBe('and 3 more');
  });
});

describe('ReplayStore.closestMatch among many recordings of the same endpoint', () => {
  it('picks the recording that differs least, not the first one with the same path', () => {
    const res: CapturedResponse = { status: 200, statusText: 'OK', headers: {}, body: Buffer.from('{}') };
    const aws = (target: string, body: object) =>
      req({
        url: 'https://redshift-data.us-east-2.amazonaws.com/',
        headers: { 'content-type': 'application/x-amz-json-1.1', 'x-amz-target': target },
        body: json(body),
      });
    const har = emptyHar();
    har.log.entries.push(
      toHarEntry(aws('RedshiftData.DescribeStatement', { Id: 'query-id-0001' }), res, new Date(), 1)
    );
    har.log.entries.push(
      toHarEntry(aws('RedshiftData.ExecuteStatement', { Sql: 'select 1', Database: 'dev' }), res, new Date(), 1)
    );

    const closest = new ReplayStore(har, config).closestMatch(
      aws('RedshiftData.ExecuteStatement', { Sql: 'select 2', Database: 'dev' }),
      config
    );
    expect(closest?.differences).toEqual(['body field "Sql": got "select 2", recording has "select 1"']);
  });
});

describe('ReplayStore.closestMatch tie-breaking', () => {
  it('prefers the recording whose differing value is most alike, e.g. the same query at another time', () => {
    const res: CapturedResponse = { status: 200, statusText: 'OK', headers: {}, body: Buffer.from('{}') };
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req({ body: json({ Sql: 'SELECT * FROM public.events' }) }), res, new Date(), 1));
    har.log.entries.push(
      toHarEntry(req({ body: json({ Sql: "select * from sales where t > '2008-01-01'" }) }), res, new Date(), 1)
    );

    const closest = new ReplayStore(har, config).closestMatch(
      req({ body: json({ Sql: "select * from sales where t > '2026-09-28'" }) }),
      config
    );
    expect(closest?.differences[0]).toContain('recording has "select * from sales where t > \'2008-01-01\'"');
  });
});

describe('describeDifferences for a different path', () => {
  it('names the path and hints at correlation when a single segment differs', () => {
    const [difference] = diff(
      req({ method: 'GET', url: 'https://bigquery.googleapis.com/bigquery/v2/projects/p/queries/job_live_0002' }),
      req({ method: 'GET', url: 'https://bigquery.googleapis.com/bigquery/v2/projects/p/queries/job_recorded_0001' })
    );
    expect(difference).toContain('path: got');
    expect(difference).toContain('ignoreFields so replay can correlate it');
  });
});
