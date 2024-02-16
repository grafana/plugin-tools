import { expect, test } from '../../../../src';

test('should return data and not display panel error when a valid query is provided', async ({
  panelEditPage,
  page,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({
    fileName: 'google-sheets-datasource-jwt.yaml',
  });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.timeRange.set({ from: '2019-01-11', to: '2019-12-15' });
  await panelEditPage.getQueryEditorRow('A').getByText('Enter SpreadsheetID').click();
  await page.keyboard.insertText('1TZlZX67Y0s4CvRro_3pCYqRCKuXer81oFp_xcsjPpe8');
  await page.keyboard.press('Enter');
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await expect(panelEditPage.panel.getErrorIcon()).not.toBeVisible();
});

test('should return an error and display panel error when an invalid query is provided', async ({
  panelEditPage,
  page,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({
    fileName: 'google-sheets-datasource-jwt.yaml',
  });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.timeRange.set({ from: '2019-01-11', to: '2019-12-15' });
  await panelEditPage.getQueryEditorRow('A').getByText('Enter SpreadsheetID').click();
  await page.keyboard.insertText('1TZlZX67Y0s4CvRro_3pCYqRCKuXer81oFp_xcsjPpe8');
  await page.keyboard.press('Enter');
  await page.getByPlaceholder('Class Data!A2:E').fill('invalid range');
  await expect(panelEditPage.refreshPanel()).not.toBeOK();
  await expect(panelEditPage.panel.getErrorIcon()).toBeVisible();
});
