import * as semver from 'semver';
import { expect, test } from '../../../src';

test.use({ featureToggles: { dashboardNewLayouts: true } });

// the dashboardNewLayouts toggle was introduced in Grafana 13. Below that the toolbar
// flow is used regardless, so skipping keeps the assertion meaningful.
test('addPanel opens the panel edit page when dashboardNewLayouts is enabled', async ({
  dashboardPage,
  page,
  grafanaVersion,
}) => {
  test.skip(semver.lt(grafanaVersion, '13.0.0'), 'dashboardNewLayouts toggle only applies to Grafana 13+');
  const panelEditPage = await dashboardPage.addPanel();
  await expect(panelEditPage.panel.locator).toBeVisible();
  await expect(page.url()).toContain('editPanel');
});
