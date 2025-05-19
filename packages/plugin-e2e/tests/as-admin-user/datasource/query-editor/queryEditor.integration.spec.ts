import { expect, test } from '../../../../src';

test('should return data and not display panel error when a valid query is provided', async ({
  panelEditPage,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await panelEditPage.datasource.set(ds.name);
  const editorRow = await panelEditPage.getQueryEditorRow('A');
  await editorRow.getByRole('textbox', { name: 'Query Text' }).fill('query');
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await expect(panelEditPage.panel.getErrorIcon()).not.toBeVisible();
});

test('should return an error and display panel error when query is invalid', async ({
  panelEditPage,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await panelEditPage.datasource.set(ds.name);
  const editorRow = await panelEditPage.getQueryEditorRow('A');
  await editorRow.getByRole('textbox', { name: 'Query Text' }).fill('error');
  await expect(panelEditPage.refreshPanel()).not.toBeOK();
  await expect(panelEditPage.panel.getErrorIcon()).toBeVisible();
});

test('should be possible to load and execute an existing valid query', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await expect(panelEditPage.panel.getErrorIcon()).not.toBeVisible();
});
