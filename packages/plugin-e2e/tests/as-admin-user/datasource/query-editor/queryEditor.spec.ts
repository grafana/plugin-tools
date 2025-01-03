import { expect, test } from '../../../../src';

test('should render query editor', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await panelEditPage.datasource.set(ds.name);
  await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

test('should list projects when clicking the projects drowndown', async ({
  panelEditPage,
  selectors,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.getQueryEditorRow('A').getByRole('combobox', { name: 'Projects' }).click();
  await expect(panelEditPage.getByGrafanaSelector(selectors.components.Select.option)).toHaveText([
    'project-1',
    'project-2',
  ]);
});

test('backToDashboard method should be backwards compatible and navigate to dashboard page', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  const panelEditPage = await dashboardPage.addPanel();
  await panelEditPage.backToDashboard();
  await expect(page.url()).not.toContain('editPanel');
});
