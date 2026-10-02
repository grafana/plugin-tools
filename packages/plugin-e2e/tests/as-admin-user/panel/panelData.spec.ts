import { expect, lt, test } from '../../../src';

test.describe('e2e data panel', () => {
  test.skip(({ grafanaVersion }) => lt(grafanaVersion, '10.4.0'), 'grafana-e2edata-panel requires Grafana 10.4.0');

  test('snapshots the data of provisioned panels', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'e2e-data-panel.json' });
    const dashboardPage = await gotoDashboardPage(dashboard);

    await expect(dashboardPage.getPanelByTitle('Table data')).toMatchDataSnapshot('table-data');
    await expect(dashboardPage.getPanelByTitle('Renamed table data')).toMatchDataSnapshot('renamed-table-data');
    await expect(dashboardPage.getPanelByTitle('Query error')).toMatchDataSnapshot('query-error');
  });

  test('returns the data after transformations', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'e2e-data-panel.json' });
    const dashboardPage = await gotoDashboardPage(dashboard);

    const data = await dashboardPage.getPanelByTitle('Renamed table data').getData();
    expect(data.state).toBe('Done');
    expect(data.series[0].fields.map((field) => field.displayName)).toEqual([
      'month',
      'temperature',
      'humidity',
      'environment',
    ]);
    expect(data.series[0].length).toBe(5);
  });

  test('returns the panel data for the refresh that triggered it', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'e2e-data-panel.json' });
    const panelEditPage = await gotoPanelEditPage({ dashboard: { uid: dashboard.uid }, id: '1' });

    const first = await panelEditPage.refreshPanelWithData();
    const second = await panelEditPage.refreshPanelWithData();

    expect(second.response.ok()).toBe(true);
    expect(second.data.requestId).not.toBe(first.data.requestId);
    expect(second.data.series[0].length).toBe(5);
    expect(second.body).toHaveProperty('results.A.frames');
  });
});
