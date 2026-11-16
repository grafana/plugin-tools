import { describe, expect, it } from 'vitest';

import { formatBuildInfo } from './bootData';

describe('formatBuildInfo', () => {
  it('includes the version, edition, commit and build time', () => {
    expect(
      formatBuildInfo({
        version: '13.4.0-19285619520',
        edition: 'Open Source',
        commit: 'da3aa3e0b3',
        buildstamp: 1794700000,
      })
    ).toBe(
      '@grafana/plugin-e2e: testing against Grafana 13.4.0-19285619520 (Open Source, commit da3aa3e0b3, built 2026-11-14T23:46:40.000Z)'
    );
  });

  it('leaves out the details that Grafana does not report', () => {
    expect(formatBuildInfo({ version: '8.5.0' })).toBe('@grafana/plugin-e2e: testing against Grafana 8.5.0');
  });

  it('reports an unknown version when buildInfo has none', () => {
    expect(formatBuildInfo({})).toBe('@grafana/plugin-e2e: testing against Grafana unknown version');
  });
});
