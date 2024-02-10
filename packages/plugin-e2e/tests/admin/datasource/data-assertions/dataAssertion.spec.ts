import * as semver from 'semver';
import { test, expect, PanelEditPage, DashboardPage } from '../../../../src';
import { Dashboard } from '../../../../src/types';

test.describe('panel edit page', () => {
  test('table panel data assertions', async ({ page, selectors, grafanaVersion, request, readProvision }) => {
    const dashboard = await readProvision<Dashboard>({ filePath: 'dashboards/redshift.json' });
    const panelEditPage = new PanelEditPage({ page, selectors, grafanaVersion, request }, { dashboard, id: '3' });
    await panelEditPage.goto();
    await panelEditPage.setVisualization('Table');
    await expect(panelEditPage.panel.locator()).toBeVisible();
    await expect(panelEditPage.panel.getData()).toContainText(['staging']);
    await expect(panelEditPage.panel.getFieldNames()).toContainText(['time', 'temperature']);
  });

  test('timeseries panel - table view assertions', async ({
    page,
    selectors,
    grafanaVersion,
    request,
    readProvision,
  }) => {
    const dashboard = await readProvision<Dashboard>({ filePath: 'dashboards/google-sheets.json' });
    const panelEditPage = new PanelEditPage({ page, selectors, grafanaVersion, request }, { dashboard, id: '1' });
    await panelEditPage.goto();
    await panelEditPage.setVisualization('Time series');
    await panelEditPage.toggleTableView();
    await expect(panelEditPage.panel.getFieldNames()).toContainText(['Stockholm', 'Berlin']);
    await expect(panelEditPage.panel.getData()).toContainText(['-1', '2.90']);
  });
});

test.describe('dashboard page', () => {
  test('getting panel by title', async ({ page, selectors, grafanaVersion, request, readProvision }) => {
    const dashboard = await readProvision<Dashboard>({ filePath: 'dashboards/redshift.json' });
    const dashboardPage = new DashboardPage({ page, selectors, grafanaVersion, request }, dashboard);
    await dashboardPage.goto();
    const panel = await dashboardPage.getPanelByTitle('Basic table example');
    await expect(panel.getFieldNames()).toContainText(['time', 'temperature', 'humidity', 'environment']);
    await expect(panel.getData()).toContainText(['25', '32', 'staging']);
  });

  test('getting panel by id', async ({ page, selectors, grafanaVersion, request, readProvision }) => {
    const dashboard = await readProvision<Dashboard>({ filePath: 'dashboards/redshift.json' });
    const dashboardPage = new DashboardPage({ page, selectors, grafanaVersion, request }, dashboard);
    await dashboardPage.goto();
    const panel = await dashboardPage.getPanelById('3');
    await expect(panel.getFieldNames()).toContainText(['time', 'temperature', 'humidity', 'environment']);
    await expect(panel.getData()).toContainText(['25', '32', 'staging']);
  });
});

test.describe('explore page', () => {
  test('table panel', async ({ grafanaVersion, explorePage }, testInfo) => {
    testInfo.skip(semver.lt(grafanaVersion, '10.1.0'), 'Weird stuff happening in Explore before Grafana 10.1.0');
    const url = semver.lt('10.0.0', grafanaVersion)
      ? `panes=%7B"RLf":%7B"datasource":"PB0CCE99F8730D01D","queries":%5B%7B"cacheDurationSeconds":300,"datasource":%7B"type":"grafana-googlesheets-datasource","uid":"PB0CCE99F8730D01D"%7D,"refId":"A","spreadsheet":"1TZlZX67Y0s4CvRro_3pCYqRCKuXer81oFp_xcsjPpe8","range":""%7D%5D,"range":%7B"from":"1547161200000","to":"1576364400000"%7D%7D%7D&schemaVersion=1&orgId=1`
      : 'left=%7B"datasource":"PB0CCE99F8730D01D","queries":%5B%7B"cacheDurationSeconds":300,"datasource":%7B"type":"grafana-googlesheets-datasource","uid":"PB0CCE99F8730D01D"%7D,"refId":"A","spreadsheet":"1TZlZX67Y0s4CvRro_3pCYqRCKuXer81oFp_xcsjPpe8","range":""%7D%5D,"range":%7B"from":"1547161200000","to":"1576364400000"%7D%7D&orgId=1';
    await explorePage.goto({
      queryParams: new URLSearchParams(url),
    });

    await expect(explorePage.tablePanel.getFieldNames()).toContainText(['Month', 'Stockholm', 'Berlin', 'Los Angeles']);
    await expect(explorePage.tablePanel.getData()).toContainText(['-1', '2.90', '13']);
  });
});
