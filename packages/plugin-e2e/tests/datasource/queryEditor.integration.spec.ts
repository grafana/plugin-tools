import { expect, test } from '../../src';
import { ProvisionFile } from '../../src/types';

test('should return data and not display panel error when a valid query is provided', async ({
  panelEditPage,
  page,
  readProvision,
}) => {
  const sheetsDataSource = await readProvision<ProvisionFile>({
    filePath: 'datasources/google-sheets-datasource-jwt.yaml',
  }).then((provision) => provision.datasources[0]);
  await panelEditPage.datasource.set(sheetsDataSource.name!);
  await panelEditPage.timeRange.set({ from: '2019-01-11', to: '2019-12-15' });
  const queryEditorRow = await panelEditPage.getQueryEditorRow('A');
  await queryEditorRow.getByText('Enter SpreadsheetID').click();
  await page.keyboard.insertText('1TZlZX67Y0s4CvRro_3pCYqRCKuXer81oFp_xcsjPpe8');
  await page.keyboard.press('Enter');
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await expect(panelEditPage).not.toHavePanelError();
});

test('should return an error and display panel error when an invalid query is provided', async ({
  panelEditPage,
  page,
  readProvision,
}) => {
  const sheetsDataSource = await readProvision<ProvisionFile>({
    filePath: 'datasources/google-sheets-datasource-jwt.yaml',
  }).then((provision) => provision.datasources[0]);
  await panelEditPage.datasource.set(sheetsDataSource.name!);
  await panelEditPage.timeRange.set({ from: '2019-01-11', to: '2019-12-15' });
  const queryEditorRow = await panelEditPage.getQueryEditorRow('A');
  await queryEditorRow.getByText('Enter SpreadsheetID').click();
  await page.keyboard.insertText('1TZlZX67Y0s4CvRro_3pCYqRCKuXer81oFp_xcsjPpe8');
  await page.keyboard.press('Enter');
  await page.getByPlaceholder('Class Data!A2:E').fill('invalid range');
  await expect(panelEditPage.refreshPanel()).not.toBeOK();
  await expect(panelEditPage).toHavePanelError();
});
