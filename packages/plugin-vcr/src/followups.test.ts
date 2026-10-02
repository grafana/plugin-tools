import { describe, expect, it } from 'vitest';
import { mergeConfig } from './config.js';
import { emptyHar, ReplayStore, toHarEntry } from './har.js';
import type { CapturedRequest, CapturedResponse } from './types.js';

const target = (op: string): Record<string, string> => ({
  'content-type': 'application/x-amz-json-1.1',
  'x-amz-target': `RedshiftData.${op}`,
});

function call(op: string, body: object): CapturedRequest {
  return {
    method: 'POST',
    url: 'https://redshift-data.us-east-2.amazonaws.com/',
    headers: target(op),
    body: Buffer.from(JSON.stringify(body)),
  };
}

function res(body: object): CapturedResponse {
  return {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/x-amz-json-1.1' },
    body: Buffer.from(JSON.stringify(body)),
  };
}

function recordedAt(second: number): Date {
  return new Date(Date.UTC(2026, 0, 1, 0, 0, second));
}

describe('ReplayStore with abandoned executions', () => {
  const config = mergeConfig({ keepHeaders: ['x-amz-target'] });
  const execute = call('ExecuteStatement', { Sql: 'select 1' });

  function recording() {
    const har = emptyHar();
    const add = (req: CapturedRequest, response: CapturedResponse, second: number) =>
      har.log.entries.push(toHarEntry(req, response, recordedAt(second), 1));
    add(execute, res({ Id: 'query-id-0001' }), 0);
    add(call('DescribeStatement', { Id: 'query-id-0001' }), res({ Id: 'query-id-0001', Status: 'SUBMITTED' }), 1);
    add(execute, res({ Id: 'query-id-0002' }), 2);
    add(call('DescribeStatement', { Id: 'query-id-0001' }), res({ Id: 'query-id-0001', Status: 'FINISHED' }), 3);
    // re-executed again as the test ended, never polled
    add(execute, res({ Id: 'query-id-0003' }), 4);
    add(call('DescribeStatement', { Id: 'query-id-0002' }), res({ Id: 'query-id-0002', Status: 'FINISHED' }), 5);
    return har;
  }

  it('only hands out query IDs the client went on to poll', () => {
    const store = new ReplayStore(recording(), config);
    const ids = [1, 2, 3, 4].map(() => JSON.parse(store.next(execute, config)!.response.content.text).Id);
    expect(ids).toEqual(['query-id-0001', 'query-id-0002', 'query-id-0002', 'query-id-0002']);
  });

  it('keeps a polling sequence whole, since a status response only echoes the ID it was asked about', () => {
    const store = new ReplayStore(recording(), config);
    const poll = call('DescribeStatement', { Id: 'query-id-0001' });
    const statuses = [1, 2, 3].map(() => JSON.parse(store.next(poll, config)!.response.content.text).Status);
    expect(statuses).toEqual(['SUBMITTED', 'FINISHED', 'FINISHED']);
  });
});
