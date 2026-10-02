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
});

test.describe('e2e data panel with redacted snapshots', () => {
  test.use({ dataSnapshot: { redact: [{ pattern: /Staging|Production/g, replacement: '<env>' }] } });
  test.skip(({ grafanaVersion }) => lt(grafanaVersion, '10.4.0'), 'grafana-e2edata-panel requires Grafana 10.4.0');

  test('redacts values from the snapshot but not from getData', async ({
    gotoDashboardPage,
    readProvisionedDashboard,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'e2e-data-panel.json' });
    const dashboardPage = await gotoDashboardPage(dashboard);
    const panel = dashboardPage.getPanelByTitle('Table data');

    // the config-level rule and this assertion's rule both apply
    await expect(panel).toMatchDataSnapshot('table-data-redacted', { redact: [/QA/g] });

    const data = await panel.getData();
    expect(data.series[0].fields[3].values).toEqual(['Staging', 'Test', 'Production', 'Development', 'QA']);
  });
});
