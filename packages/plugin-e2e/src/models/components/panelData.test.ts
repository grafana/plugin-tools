import { describe, expect, it } from 'vitest';

import { getRequestIdFromUrl, isMatchingRequestId, parsePanelData } from './panelData';

describe('getRequestIdFromUrl', () => {
  it('should read the requestId query param', () => {
    expect(getRequestIdFromUrl('http://localhost:3000/api/ds/query?ds_type=x&requestId=SQR12')).toBe('SQR12');
  });

  it('should return undefined when there is no requestId', () => {
    expect(getRequestIdFromUrl('http://localhost:3000/api/ds/query')).toBeUndefined();
  });

  it('should return undefined for an invalid url', () => {
    expect(getRequestIdFromUrl('not a url')).toBeUndefined();
  });
});

describe('isMatchingRequestId', () => {
  it('should match identical ids', () => {
    expect(isMatchingRequestId('SQR12', 'SQR12')).toBe(true);
  });

  it('should not match an id that only shares a prefix', () => {
    expect(isMatchingRequestId('SQR1', 'SQR12')).toBe(false);
  });

  it('should match split or paged sub requests', () => {
    expect(isMatchingRequestId('SQR12', 'SQR12_3')).toBe(true);
  });

  it('should match mixed data source sub requests', () => {
    expect(isMatchingRequestId('SQR12', 'mixed-0-SQR12')).toBe(true);
    expect(isMatchingRequestId('SQR2', 'mixed-0-SQR12')).toBe(false);
  });

  it('should not match empty ids', () => {
    expect(isMatchingRequestId('', 'SQR12')).toBe(false);
    expect(isMatchingRequestId('SQR12', '')).toBe(false);
  });
});

describe('parsePanelData', () => {
  it('should parse a supported payload', () => {
    const data = parsePanelData('{"schemaVersion":1,"state":"Done","errors":[],"series":[]}', 'the panel');
    expect(data.state).toBe('Done');
  });

  it('should throw when the payload is not JSON', () => {
    expect(() => parsePanelData(null, 'the panel')).toThrow(/grafana-e2edata-panel/);
  });

  it('should throw on an unsupported schema version', () => {
    expect(() => parsePanelData('{"schemaVersion":99}', 'the panel')).toThrow(/schema version 99/);
  });
});
