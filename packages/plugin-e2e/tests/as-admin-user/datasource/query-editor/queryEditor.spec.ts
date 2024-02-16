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

test('should list spreadsheets when clicking on spreadsheet segment', async ({
  panelEditPage,
  page,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource<SheetsJsonData, SheetsSecureJsonData>({
    fileName: 'google-sheets-datasource-jwt.yaml',
  });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.mockResourceResponse('spreadsheets', GOOGLE_SHEETS_SPREADSHEETS);
  await panelEditPage.getQueryEditorRow('A').getByText('Enter SpreadsheetID').click();
  await expect(page.getByText(GOOGLE_SHEETS_SPREADSHEETS.spreadsheets.sheet1, { exact: true })).toHaveCount(1);
  await expect(page.getByText(GOOGLE_SHEETS_SPREADSHEETS.spreadsheets.sheet2, { exact: true })).toHaveCount(1);
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
