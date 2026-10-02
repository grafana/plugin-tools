import { expect, lt, test } from '../../../src';

// dataSnapshot is a worker option, so it can only be set at the top level of a file
test.use({ dataSnapshot: { redact: [{ pattern: /Staging|Production/g, replacement: '<env>' }] } });

test('redacts values from the snapshot but not from getData', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
  grafanaVersion,
}) => {
  test.skip(lt(grafanaVersion, '10.4.0'), 'grafana-e2edata-panel requires Grafana 10.4.0');
  const dashboard = await readProvisionedDashboard({ fileName: 'e2e-data-panel.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  const panel = dashboardPage.getPanelByTitle('Table data');

  // the file-level rule and this assertion's rule both apply
  await expect(panel).toMatchDataSnapshot('table-data-redacted', { redact: [/QA/g] });

  const data = await panel.getData();
  expect(data.series[0].fields[3].values).toEqual(['Staging', 'Test', 'Production', 'Development', 'QA']);
});
