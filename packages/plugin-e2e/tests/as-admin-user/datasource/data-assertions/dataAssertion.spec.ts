import * as semver from 'semver';
import { test, expect } from '../../../../src';

test.describe('panel edit page', () => {
  test('table panel data assertions', async ({ gotoPanelEditPage, readProvisionedDashboard }, testInfo) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
    const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
    await expect(panelEditPage.panel.locator).toBeVisible();
    await expect(panelEditPage.panel.data).toContainText(['22.2', '70', 'Staging']);
    await expect(panelEditPage.panel.fieldNames).toContainText(['time', 'temperature', 'humidity', 'environment']);
  });

  test('timeseries panel - table view assertions', async ({ readProvisionedDashboard, gotoPanelEditPage }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
    const panelEditPage = await gotoPanelEditPage({ dashboard, id: '4' });
    await panelEditPage.toggleTableView();
    await expect(panelEditPage.panel.fieldNames).toContainText(['time', 'temperature', 'humidity', 'environment']);
    await expect(panelEditPage.panel.data).toContainText(['22.2', '70', 'Staging']);
  });
});

test.describe('dashboard page', () => {
  test('getting panel by title', async ({ readProvisionedDashboard, gotoDashboardPage }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
    const dashboardPage = await gotoDashboardPage(dashboard);
    const panel = await dashboardPage.getPanelByTitle('Single row');
    await expect(panel.data).toContainText(['22.2', '70', 'Staging']);
    await expect(panel.fieldNames).toContainText(['time', 'temperature', 'humidity', 'environment']);
  });

  test('getting panel by id', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
    const dashboardPage = await gotoDashboardPage(dashboard);
    const panel = await dashboardPage.getPanelById('2');
    await expect(panel.data).toContainText(['22.2', '70', 'Staging']);
    await expect(panel.fieldNames).toContainText(['time', 'temperature', 'humidity', 'environment']);
  });
});

test.describe('explore page', () => {
  test('table panel', async ({ grafanaVersion, explorePage }) => {
    const params = semver.lt(grafanaVersion, '10.0.0')
      ? 'orgId=1&left=%7B"datasource":"P6E498B96656A7F9B","queries":%5B%7B"refId":"A","datasource":%7B"type":"grafana-test-datasource","uid":"P6E498B96656A7F9B"%7D,"constant":9,"project":"project-2","queryText":"test%20query"%7D%5D,"range":%7B"from":"now-1h","to":"now"%7D%7D'
      : `?schemaVersion=1&panes=%7B"9ye":%7B"datasource":"P6E498B96656A7F9B","queries":%5B%7B"constant":6.5,"refId":"A","datasource":%7B"type":"grafana-test-datasource","uid":"P6E498B96656A7F9B"%7D,"queryText":"test%20query"%7D%5D,"range":%7B"from":"now-1h","to":"now"%7D%7D%7D&orgId=1`;

    await explorePage.goto({ queryParams: new URLSearchParams(params) });

    await expect(explorePage.tablePanel.fieldNames).toContainText(['time', 'values']);
  });
});
