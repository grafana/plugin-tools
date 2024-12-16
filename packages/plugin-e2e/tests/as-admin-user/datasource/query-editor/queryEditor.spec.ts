import { expect, test } from '../../../../src';
import { GOOGLE_SHEETS_SPREADSHEETS } from '../mocks/resource';

export interface SheetsJsonData {
  authenticationType: string;
  tokenUri?: string;
  clientEmail?: string;
  defaultProject?: string;
  privateKeyPath?: string;
}

export interface SheetsSecureJsonData {
  privateKey?: string;
}

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

test('should set correct cache time on query passed to the backend', async ({
  panelEditPage,
  page,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'google-sheets-datasource-jwt.yaml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.mockResourceResponse('spreadsheets', GOOGLE_SHEETS_SPREADSHEETS);
  await panelEditPage.getQueryEditorRow('A').getByText('5m', { exact: true }).click();
  await page.keyboard.insertText('1h');
  await page.keyboard.press('Enter');

  const queryReq = panelEditPage.waitForQueryDataRequest((request) =>
    (request.postData() ?? '').includes('"cacheDurationSeconds":3600')
  );

  await panelEditPage.refreshPanel();
  await expect(await queryReq).toBeTruthy();
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
