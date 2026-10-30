import { describe, expect, it } from 'vitest';

import { parsePanelData } from './panelData';

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
