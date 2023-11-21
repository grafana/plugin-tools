import { expect, test } from '../../src';
import { ProvisionFile } from '../../src/types';
import { GOOGLE_SHEETS_SPREADSHEETS } from './mocks/resource';

test('should list spreadsheets when clicking on spreadsheet segment', async ({
  panelEditPage,
  page,
  readProvision,
}) => {
  const sheetsDataSource = await readProvision<ProvisionFile>({
    filePath: 'datasources/google-sheets-datasource-jwt.yaml',
  }).then((provision) => provision.datasources[0]);
  await panelEditPage.datasource.set(sheetsDataSource.name!);
  const queryEditorRow = await panelEditPage.getQueryEditorRow('A');
  await panelEditPage.mockResourceResponse('spreadsheets', GOOGLE_SHEETS_SPREADSHEETS);
  await queryEditorRow.getByText('Enter SpreadsheetID').click();
  await expect(page.getByText(GOOGLE_SHEETS_SPREADSHEETS.spreadsheets.sheet1, { exact: true })).toHaveCount(1);
  await expect(page.getByText(GOOGLE_SHEETS_SPREADSHEETS.spreadsheets.sheet2, { exact: true })).toHaveCount(1);
});

test('should set correct cache time on query passed to the backend', async ({ panelEditPage, page, readProvision }) => {
  const sheetsDataSource = await readProvision<ProvisionFile>({
    filePath: 'datasources/google-sheets-datasource-jwt.yaml',
  }).then((provision) => provision.datasources[0]);
  await panelEditPage.datasource.set(sheetsDataSource.name!);
  const queryEditorRow = await panelEditPage.getQueryEditorRow('A');
  await panelEditPage.mockResourceResponse('spreadsheets', GOOGLE_SHEETS_SPREADSHEETS);
  await queryEditorRow.getByText('5m', { exact: true }).click();
  await page.keyboard.insertText('1h');
  await page.keyboard.press('Enter');

  const queryReq = panelEditPage.waitForQueryDataRequest((request) =>
    (request.postData() ?? '').includes('"cacheDurationSeconds":3600')
  );

  await panelEditPage.refreshPanel();
  await expect(await queryReq).toBeTruthy();
});
