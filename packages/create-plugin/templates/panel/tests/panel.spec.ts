import * as semver from 'semver';
import { test, expect } from '@grafana/plugin-e2e';

test('should display "No data" in case panel data is empty', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  await expect(panelEditPage.panel.locator).toContainText('No data');
});

test('should display circle when data is passed to the panel', async ({
  panelEditPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('{{kebabToPascalKebab pluginName }}');
  await expect(page.getByTestId('simple-panel-circle')).toBeVisible();
});

test('should display series counter when "Show series counter" option is enabled', async ({
  panelEditPage,
  readProvisionedDataSource,
  page,
  selectors,
  grafanaVersion
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('{{kebabToPascalKebab pluginName }}');
  await panelEditPage.collapseSection('{{kebabToPascalKebab pluginName }}');
  await expect(page.getByTestId('simple-panel-circle')).toBeVisible();

  const seriesCounterLabel = panelEditPage.getByGrafanaSelector(
    selectors.components.PanelEditor.OptionsPane.fieldLabel('{{kebabToPascalKebab pluginName }} Show series counter')
  );
  const switchField = semver.gte(grafanaVersion, '11.4.0')
    ? seriesCounterLabel.getByRole('switch')
    : seriesCounterLabel.getByLabel('Toggle switch');
  await switchField.click({ force: true });
  await expect(page.getByTestId('simple-panel-series-counter')).toBeVisible();
});
