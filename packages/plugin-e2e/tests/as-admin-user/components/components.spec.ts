import { expect, test } from '../../../src';

test('components.getDataSourcePicker should set the data source', async ({
  panelEditPage,
  components,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  const picker = components.getDataSourcePicker();
  await picker.set(ds.name);
  await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

test('components.getDataSourcePicker should set the data source when scoped to a root locator', async ({
  panelEditPage,
  components,
  readProvisionedDataSource,
  selectors,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  const root = panelEditPage.getByGrafanaSelector(selectors.components.PanelEditor.General.content);
  const picker = components.getDataSourcePicker(root);
  await picker.set(ds.name);
  await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});
