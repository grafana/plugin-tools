import * as semver from 'semver';
import { test, expect } from '../../../../src';

test.describe('panel edit page', () => {
  test('table panel data assertions', async ({
    page,
    selectors,
    grafanaVersion,
    request,
    gotoPanelEditPage,
    readProvisionedDashboard,
  }, testInfo) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
    const panelEditPage = await gotoPanelEditPage({ dashboard, id: '3' });
    await panelEditPage.setVisualization('Table');
    await expect(panelEditPage.panel.locator).toBeVisible();
    await expect(panelEditPage.panel.data).toContainText(['staging']);
    await expect(panelEditPage.panel.fieldNames).toContainText(['time', 'temperature']);
  });

  test('timeseries panel - table view assertions', async ({ readProvisionedDashboard, gotoPanelEditPage }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'google-sheets.json' });
    const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
    await panelEditPage.setVisualization('Time series');
    await panelEditPage.toggleTableView();
    await expect(panelEditPage.panel.fieldNames).toContainText(['Stockholm', 'Berlin']);
    await expect(panelEditPage.panel.data).toContainText(['-1', '2.90']);
  });
});

test.describe('dashboard page', () => {
  test('getting panel by title', async ({ readProvisionedDashboard, gotoDashboardPage }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
    const dashboardPage = await gotoDashboardPage(dashboard);
    const panel = await dashboardPage.getPanelByTitle('Basic table example');
    await expect(panel.fieldNames).toContainText(['time', 'temperature', 'humidity', 'environment']);
    await expect(panel.data).toContainText(['25', '32', 'staging']);
  });

  test('getting panel by id', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
    const dashboardPage = await gotoDashboardPage(dashboard);
    const panel = await dashboardPage.getPanelById('3');
    await expect(panel.fieldNames).toContainText(['time', 'temperature', 'humidity', 'environment']);
    await expect(panel.data).toContainText(['25', '32', 'staging']);
  });
});

test.describe('explore page', () => {
  test('table panel', async ({ grafanaVersion, explorePage }) => {
    const url = semver.lt('10.0.0', grafanaVersion)
      ? `panes=%7B"_t4":%7B"datasource":"grafana","queries":%5B%7B"queryType":"randomWalk","refId":"A","datasource":%7B"type":"datasource","uid":"grafana"%7D%7D%5D,"range":%7B"from":"now-6h","to":"now"%7D%7D%7D&orgId=1&left=%7B"datasource":"grafana","queries":%5B%7B"refId":"A","datasource":%7B"type":"datasource","uid":"grafana"%7D,"queryType":"randomWalk"%7D%5D,"range":%7B"from":"now-1h","to":"now"%7D%7D`
      : 'left=%7B"datasource":"grafana","queries":%5B%7B"queryType":"randomWalk","refId":"A","datasource":%7B"type":"datasource","uid":"grafana"%7D%7D%5D,"range":%7B"from":"1547161200000","to":"1576364400000"%7D%7D&orgId=1';

    await explorePage.goto({
      queryParams: new URLSearchParams(url),
    });

    await expect(explorePage.tablePanel.fieldNames).toContainText(['time', 'A-series']);
  });
});
