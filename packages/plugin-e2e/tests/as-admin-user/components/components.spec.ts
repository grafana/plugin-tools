import { expect, test } from '../../../src';

test('components.dataSourcePicker should set the data source', async ({
  panelEditPage,
  components,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await components.dataSourcePicker.set(ds.name);
  await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

test('components.dataSourcePicker.within should set the data source when scoped to a root locator', async ({
  panelEditPage,
  components,
  readProvisionedDataSource,
  selectors,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  const root = panelEditPage.getByGrafanaSelector(selectors.components.PanelEditor.General.content);
  await components.dataSourcePicker.within(root).set(ds.name);
  await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

test('components.timeRangePicker should set the time range', async ({
  panelEditPage,
  components,
  selectors,
}) => {
  await components.timeRangePicker.set({ from: '2020-01-01 00:00:00', to: '2020-01-02 00:00:00' });
  const openButton = panelEditPage.getByGrafanaSelector(selectors.components.TimePicker.openButton);
  await expect(openButton).toContainText('2020-01-01 00:00:00');
});

test('components.timeRangePicker.within should set the time range when scoped to a root locator', async ({
  panelEditPage,
  components,
  selectors,
}) => {
  const root = panelEditPage.getByGrafanaSelector(selectors.components.NavToolbar.container);
  await components.timeRangePicker.within(root).set({ from: '2020-01-01 00:00:00', to: '2020-01-02 00:00:00' });
  const openButton = panelEditPage.getByGrafanaSelector(selectors.components.TimePicker.openButton);
  await expect(openButton).toContainText('2020-01-01 00:00:00');
});
