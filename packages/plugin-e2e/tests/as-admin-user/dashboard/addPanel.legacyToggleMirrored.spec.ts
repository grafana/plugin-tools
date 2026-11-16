import * as semver from 'semver';
import { expect, test } from '../../../src';

test.use({ featureToggles: { dashboardNewLayouts: false } });

test('a legacy dashboardNewLayouts toggle is applied through OpenFeature on 13.3+', async ({
  dashboardPage,
  getBooleanOpenFeatureFlag,
  grafanaVersion,
  page,
}) => {
  test.skip(semver.lt(grafanaVersion, '13.3.0-0'), 'dashboardNewLayouts is read through OpenFeature from Grafana 13.3');
  expect(await getBooleanOpenFeatureFlag('dashboardNewLayouts')).toBe(false);
  const panelEditPage = await dashboardPage.addPanel();
  await expect(panelEditPage.panel.locator).toBeVisible();
  expect(page.url()).toContain('editPanel');
});
