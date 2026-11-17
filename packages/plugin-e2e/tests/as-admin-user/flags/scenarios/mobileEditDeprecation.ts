import * as semver from 'semver';
import { expect, test } from '../../../../src';

export function mobileEditDeprecationScenarios(enabled: boolean) {
  test.describe(`grafana.mobileEditDeprecation ${enabled ? 'on' : 'off'}`, () => {
    const minVersion = enabled ? '13.4.0' : '13.3.0';
    test.skip(
      ({ grafanaVersion }) => semver.lt(grafanaVersion, minVersion),
      `these specs run on Grafana ${minVersion}+ only`
    );

    if (enabled) {
      test('hides the edit controls below 576px', async ({
        gotoDashboardPage,
        readProvisionedDashboard,
        selectors,
      }) => {
        const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
        const dashboardPage = await gotoDashboardPage(dashboard);
        await expect(dashboardPage.getPanelByTitle('Table data').locator).toBeVisible();
        await expect(
          dashboardPage.getByGrafanaSelector(selectors.components.NavToolbar.editDashboard.editButton)
        ).toBeHidden();
      });
      return;
    }

    test('addPanel opens the panel editor on an existing dashboard at a small viewport', async ({
      gotoDashboardPage,
      readProvisionedDashboard,
      selectors,
      page,
    }) => {
      const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
      const dashboardPage = await gotoDashboardPage(dashboard);
      const panelEditPage = await dashboardPage.addPanel();
      await expect(panelEditPage.getByGrafanaSelector(selectors.components.PanelEditor.General.content)).toBeVisible();
      await expect(page).toHaveURL(/editPanel/);
    });
  });
}
