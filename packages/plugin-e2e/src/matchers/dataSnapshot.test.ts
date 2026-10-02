import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { PanelData } from '../models/components/panelData';
import { compareDataSnapshot, getDataSnapshotPath, serializeDataSnapshot } from './dataSnapshot';

function createPanelData(): PanelData {
  return {
    schemaVersion: 1,
    requestId: 'SQR12',
    state: 'Done',
    errors: [],
    series: [
      {
        refId: 'A',
        length: 2,
        meta: { type: 'table', custom: { executionTime: 42 } },
        fields: [
          { name: 'time', displayName: 'time', type: 'time', config: {}, values: [1, 2] },
          { name: 'value', displayName: 'value', type: 'number', config: { unit: 'kW' }, values: [10, 20] },
        ],
      },
    ],
  };
}

describe('serializeDataSnapshot', () => {
  it('should drop the request id', () => {
    expect(serializeDataSnapshot(createPanelData())).not.toContain('SQR12');
  });

  it('should drop meta.custom by default', () => {
    expect(serializeDataSnapshot(createPanelData())).not.toContain('executionTime');
    expect(serializeDataSnapshot(createPanelData(), { includeMetaCustom: true })).toContain('executionTime');
  });

  it('should replace ignored field values', () => {
    const snapshot = JSON.parse(serializeDataSnapshot(createPanelData(), { ignoreFields: ['time'] }));
    expect(snapshot.series[0].fields[0].values).toEqual(['<ignored>']);
    expect(snapshot.series[0].fields[1].values).toEqual([10, 20]);
  });

  it('should drop ignored paths with wildcards', () => {
    const snapshot = JSON.parse(serializeDataSnapshot(createPanelData(), { ignorePaths: ['series.*.meta'] }));
    expect(snapshot.series[0].meta).toBeUndefined();
  });

  it('should normalise nested frames', () => {
    const data = createPanelData();
    data.series[0].fields[1].values = [{ refId: 'B', length: 0, meta: { custom: { token: 'x' } }, fields: [] }];
    expect(serializeDataSnapshot(data)).not.toContain('token');
  });

  it('should produce the same output regardless of key order', () => {
    const data = createPanelData();
    const reordered = { series: data.series, errors: data.errors, state: data.state, schemaVersion: 1 } as PanelData;
    expect(serializeDataSnapshot(reordered)).toBe(serializeDataSnapshot(data));
  });
});

describe('getDataSnapshotPath', () => {
  it('should build a path from the test file, title and name', () => {
    expect(getDataSnapshotPath('/repo/tests/query.spec.ts', ['Query editor', 'shows rows'], 'logs/query')).toBe(
      '/repo/tests/__data-snapshots__/query.spec.ts/Query-editor-shows-rows/logs-query.json'
    );
  });
});

describe('compareDataSnapshot', () => {
  const tempDir = () => mkdtempSync(join(tmpdir(), 'data-snapshot-'));

  it('should write a missing snapshot and fail once in missing mode', () => {
    const path = join(tempDir(), 'a.json');
    const result = compareDataSnapshot(path, 'actual', 'missing');
    expect(result).toMatchObject({ pass: false, written: true });
    expect(readFileSync(path, 'utf-8')).toBe('actual');
  });

  it('should not write a missing snapshot in none mode', () => {
    const result = compareDataSnapshot(join(tempDir(), 'a.json'), 'actual', 'none');
    expect(result).toMatchObject({ pass: false, written: false });
  });

  it('should pass when the snapshot matches', () => {
    const path = join(tempDir(), 'a.json');
    writeFileSync(path, 'same');
    expect(compareDataSnapshot(path, 'same', 'none')).toMatchObject({ pass: true, written: false });
  });

  it('should fail on a mismatch without updating', () => {
    const path = join(tempDir(), 'a.json');
    writeFileSync(path, 'expected');
    expect(compareDataSnapshot(path, 'actual', 'missing')).toMatchObject({ pass: false, expected: 'expected' });
    expect(readFileSync(path, 'utf-8')).toBe('expected');
  });

  it('should overwrite a mismatch in changed mode', () => {
    const path = join(tempDir(), 'a.json');
    writeFileSync(path, 'expected');
    expect(compareDataSnapshot(path, 'actual', 'changed')).toMatchObject({ pass: true, written: true });
    expect(readFileSync(path, 'utf-8')).toBe('actual');
  });
});
