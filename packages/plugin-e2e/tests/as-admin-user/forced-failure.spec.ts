import { test, expect } from '../../src';
import * as semver from 'semver';

// TEMP (plugin-actions#253): force a failure on Grafana >= 12 so that failing Playwright reports
// upload to GCS and render in the PR comment. remove before merging.
test('forced failure on Grafana >= 12 (plugin-actions#253)', async ({ grafanaVersion }) => {
  expect(
    semver.gte(grafanaVersion, '12.0.0'),
    `Grafana "${grafanaVersion}" >= 12 - forcing failure to exercise GCS report upload`
  ).toBe(false);
});
