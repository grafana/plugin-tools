import * as semver from 'semver';
import { test, expect } from '../src';

test('should resolve ds picker selector with test id for grafana 10 and later', async ({
  grafanaVersion,
  selectors,
}, testInfo) => {
  testInfo.skip(semver.lt(grafanaVersion, '10.0.0'));
  expect(selectors.components.DataSourcePicker.container).toBe('data-testid Data source picker select container');
});

test('should resolve ds picker selector without test id for grafana 10 and later', async ({
  grafanaVersion,
  selectors,
}, testInfo) => {
  testInfo.skip(semver.gte(grafanaVersion, '10.0.0'));
  expect(selectors.components.DataSourcePicker.container).toBe('Data source picker select container');
});
