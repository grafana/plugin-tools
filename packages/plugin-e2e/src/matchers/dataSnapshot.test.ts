import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { PanelData } from '../models/components/panelData';
import {
  compareDataSnapshot,
  getDataSnapshotPath,
  mergeDataSnapshotOptions,
  RedactRule,
  serializeDataSnapshot,
} from './dataSnapshot';

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

describe('serializeDataSnapshot redact', () => {
  const instanceId = 'i-02b9812e73e8cd9b1';
  const instanceRule: RedactRule = { pattern: /i-([0-9a-f]{2})[0-9a-f]+/g, replacement: 'i-$1...' };

  function createCloudWatchData(): PanelData {
    const data = createPanelData();
    data.series[0].fields[1] = {
      ...data.series[0].fields[1],
      labels: { InstanceId: instanceId },
      config: {
        links: [{ title: 'View in console', url: `https://console.aws.amazon.com/#metrics=${instanceId}&x=1` }],
      },
    };
    data.series[0].fields.push({
      name: 'instance',
      displayName: 'instance',
      type: 'string',
      config: {},
      values: [instanceId, instanceId],
    });
    return data;
  }

  it('should redact labels, string values and link urls', () => {
    const snapshot = serializeDataSnapshot(createCloudWatchData(), { redact: [instanceRule] });
    expect(snapshot).not.toContain(instanceId);
    const parsed = JSON.parse(snapshot);
    expect(parsed.series[0].fields[1].labels.InstanceId).toBe('i-02...');
    expect(parsed.series[0].fields[1].config.links[0].url).toBe('https://console.aws.amazon.com/#metrics=i-02...&x=1');
    expect(parsed.series[0].fields[2].values).toEqual(['i-02...', 'i-02...']);
  });

  it('should replace with "<redacted>" for a bare pattern', () => {
    const parsed = JSON.parse(serializeDataSnapshot(createCloudWatchData(), { redact: [/i-[0-9a-f]+/g] }));
    expect(parsed.series[0].fields[1].labels.InstanceId).toBe('<redacted>');
  });

  it('should support a replacement function', () => {
    const rule: RedactRule = { pattern: /i-[0-9a-f]+/g, replacement: (match) => `i-${match.length}` };
    const parsed = JSON.parse(serializeDataSnapshot(createCloudWatchData(), { redact: [rule] }));
    expect(parsed.series[0].fields[1].labels.InstanceId).toBe('i-19');
  });

  it('should leave numbers, keys and non-matching strings untouched', () => {
    const parsed = JSON.parse(serializeDataSnapshot(createCloudWatchData(), { redact: [/\d+/g] }));
    expect(parsed.series[0].fields[0].values).toEqual([1, 2]);
    expect(parsed.series[0].length).toBe(2);
    expect(Object.keys(parsed.series[0].fields[1].labels)).toEqual(['InstanceId']);
    expect(parsed.series[0].fields[1].displayName).toBe('value');
  });

  it('should produce the same output on every run', () => {
    expect(serializeDataSnapshot(createCloudWatchData(), { redact: [instanceRule] })).toBe(
      serializeDataSnapshot(createCloudWatchData(), { redact: [instanceRule] })
    );
  });

  it('should warn once and replace only the first match for a non-global pattern', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const data = createCloudWatchData();
    data.series[0].fields[2].values = [`${instanceId} ${instanceId}`];

    const parsed = JSON.parse(serializeDataSnapshot(data, { redact: [/i-0[0-9a-f]+/] }));
    serializeDataSnapshot(data, { redact: [/i-0[0-9a-f]+/] });

    expect(parsed.series[0].fields[2].values).toEqual([`<redacted> ${instanceId}`]);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('mergeDataSnapshotOptions', () => {
  const globalRule = /global/g;
  const localRule = /local/g;

  it('should append per-assertion lists to the defaults', () => {
    const merged = mergeDataSnapshotOptions(
      { redact: [globalRule], ignorePaths: ['a'], ignoreFields: ['time'] },
      { redact: [localRule], ignorePaths: ['b'] }
    );
    expect(merged.redact).toEqual([globalRule, localRule]);
    expect(merged.ignorePaths).toEqual(['a', 'b']);
    expect(merged.ignoreFields).toEqual(['time']);
  });

  it('should let the per-assertion includeMetaCustom win', () => {
    expect(mergeDataSnapshotOptions({ includeMetaCustom: true }, { includeMetaCustom: false }).includeMetaCustom).toBe(
      false
    );
    expect(mergeDataSnapshotOptions({ includeMetaCustom: true }, {}).includeMetaCustom).toBe(true);
  });

  it('should ignore the defaults when inheritDefaults is false', () => {
    const merged = mergeDataSnapshotOptions({ redact: [globalRule] }, { redact: [localRule], inheritDefaults: false });
    expect(merged).toEqual({ redact: [localRule] });
  });

  it('should handle missing defaults', () => {
    expect(mergeDataSnapshotOptions(undefined, { redact: [localRule] })).toEqual({ redact: [localRule] });
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

  it('should pass when only the formatting of the snapshot differs', () => {
    const path = join(tempDir(), 'a.json');
    writeFileSync(path, '{ "values": [1, 2, 3] }');
    expect(compareDataSnapshot(path, '{\n  "values": [\n    1,\n    2,\n    3\n  ]\n}\n', 'none')).toMatchObject({
      pass: true,
      written: false,
    });
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
