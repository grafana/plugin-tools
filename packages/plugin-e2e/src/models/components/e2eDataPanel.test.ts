import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { PanelData } from './panelData';

interface PanelModule {
  serializePanelData: (data: unknown) => PanelData;
}

// the panel is plain AMD, so evaluate it with a stub `define` and minimal react/@grafana/data stand-ins
function loadPanelModule(): PanelModule {
  const source = readFileSync(join(__dirname, '../../../e2e-data-panel/module.js'), 'utf-8');
  let panelModule: PanelModule | undefined;
  const define = (_deps: string[], factory: (...args: unknown[]) => PanelModule) => {
    panelModule = factory(
      { createElement: () => null },
      {
        PanelPlugin: class {},
        getFieldDisplayName: (field: { name: string; config?: { displayName?: string } }) =>
          field.config?.displayName ?? field.name,
      }
    );
  };
  new Function('define', source)(define);
  return panelModule!;
}

const { serializePanelData } = loadPanelModule();

describe('e2e data panel serializePanelData', () => {
  it('should serialise frames with allowlisted meta and config', () => {
    const data = serializePanelData({
      state: 'Done',
      request: { requestId: 'SQR3' },
      series: [
        {
          refId: 'A',
          name: 'response',
          length: 2,
          meta: { type: 'table', executedQueryString: 'select 1', stats: [{ value: 1 }] },
          fields: [
            {
              name: 'value',
              type: 'number',
              labels: { host: 'a' },
              config: { unit: 'kW', color: { mode: 'thresholds' }, displayName: 'Power' },
              values: [1, 2],
            },
          ],
        },
      ],
    });

    expect(data).toEqual({
      schemaVersion: 1,
      requestId: 'SQR3',
      state: 'Done',
      errors: [],
      series: [
        {
          refId: 'A',
          name: 'response',
          length: 2,
          meta: { type: 'table' },
          fields: [
            {
              name: 'value',
              displayName: 'Power',
              type: 'number',
              labels: { host: 'a' },
              config: { unit: 'kW', displayName: 'Power' },
              values: [1, 2],
            },
          ],
        },
      ],
    });
  });

  it('should encode values that JSON cannot represent', () => {
    const data = serializePanelData({
      state: 'Done',
      series: [
        {
          length: 4,
          fields: [{ name: 'v', type: 'number', config: {}, values: [NaN, Infinity, -Infinity, undefined] }],
        },
      ],
    });
    expect(data.series[0].fields[0].values).toEqual(['NaN', 'Infinity', '-Infinity', null]);
  });

  it('should read values from a vector', () => {
    const data = serializePanelData({
      state: 'Done',
      series: [{ length: 1, fields: [{ name: 'v', type: 'number', config: {}, values: { toArray: () => [7] } }] }],
    });
    expect(data.series[0].fields[0].values).toEqual([7]);
  });

  it('should serialise nested frames and internal links', () => {
    const data = serializePanelData({
      state: 'Done',
      series: [
        {
          length: 1,
          fields: [
            {
              name: 'nested',
              type: 'frame',
              config: { links: [{ title: 'Trace', url: '', internal: { datasourceUid: 'tempo', query: {} } }] },
              values: [{ refId: 'inner', length: 0, fields: [] }],
            },
          ],
        },
      ],
    });
    const field = data.series[0].fields[0];
    expect(field.config.links).toEqual([{ title: 'Trace', url: '', internal: { datasourceUid: 'tempo' } }]);
    expect(field.values[0]).toMatchObject({ refId: 'inner', length: 0, fields: [] });
  });

  it('should serialise errors', () => {
    const data = serializePanelData({
      state: 'Error',
      series: [],
      errors: [{ refId: 'A', message: 'boom', status: 500, traceId: 'x' }],
    });
    expect(data.errors).toEqual([{ refId: 'A', message: 'boom', status: 500 }]);
  });

  it('should fall back to the legacy single error', () => {
    const data = serializePanelData({ state: 'Error', series: [], error: { message: 'boom' } });
    expect(data.errors).toEqual([{ message: 'boom' }]);
  });
});
