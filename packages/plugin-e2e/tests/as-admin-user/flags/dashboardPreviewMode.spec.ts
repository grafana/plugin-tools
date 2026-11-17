import * as semver from 'semver';
import { expect, test } from '../../../src';

test.use({
  openFeature: { flags: { 'grafana.dashboardPreviewMode': true } },
});

test.describe('grafana.dashboardPreviewMode on', () => {
  test.skip(
    ({ grafanaVersion }) => semver.lt(grafanaVersion, '13.4.0'),
    'the e2e selectors for this flag ship in Grafana 13.4'
  );

  test('addPanel opens the panel editor on an existing dashboard', async ({
    gotoDashboardPage,
    readProvisionedDashboard,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
    const dashboardPage = await gotoDashboardPage(dashboard);
    const panelEditPage = await dashboardPage.addPanel();
    await expect(panelEditPage.panel.locator).toBeVisible();
    await expect(page).toHaveURL(/editPanel/);
  });
});
