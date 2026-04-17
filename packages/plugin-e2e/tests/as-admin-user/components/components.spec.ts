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
