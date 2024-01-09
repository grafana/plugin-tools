import { expect, test } from '../../../src';
import { ProvisionFile } from '../../../src/types';

test('should return data and not display panel error when a valid query is provided', async ({
  explorePage,
  page,
  readProvision,
}) => {
  const provision = await readProvision<ProvisionFile>({ filePath: 'datasources/google-sheets-datasource-jwt.yaml' });
  await explorePage.datasource.set(provision.datasources?.[0]!.name!);
  await explorePage.timeRange.set({ from: '2019-01-11', to: '2019-12-15' });
  const queryEditorRow = await explorePage.getQueryEditorRow('A');
  await queryEditorRow.getByText('Enter SpreadsheetID').click();
  await page.keyboard.insertText('1TZlZX67Y0s4CvRro_3pCYqRCKuXer81oFp_xcsjPpe8');
  const responsePromise = page.waitForResponse((resp) => resp.url().includes('/api/ds/query'));
  await page.keyboard.press('Tab');
  await responsePromise;
  await expect(await explorePage.runQuery()).toBeOK();
});

test('should return an error and display panel error when an invalid query is provided', async ({
  explorePage,
  page,
  readProvision,
}) => {
  const provision = await readProvision<ProvisionFile>({ filePath: 'datasources/google-sheets-datasource-jwt.yaml' });
  await explorePage.datasource.set(provision.datasources?.[0]!.name!);
  await explorePage.timeRange.set({ from: '2019-01-11', to: '2019-12-15' });
  const queryEditorRow = await explorePage.getQueryEditorRow('A');
  await page.getByPlaceholder('Class Data!A2:E').fill('invalid range');
  await page.keyboard.press('Tab');
  await queryEditorRow.getByText('Enter SpreadsheetID').click();
  await page.keyboard.insertText('1TZlZX67Y0s4CvRro_3pCYqRCKuXer81oFp_xcsjPpe8');
  const responsePromise = page.waitForResponse((resp) => resp.url().includes('/api/ds/query'));
  await page.keyboard.press('Tab');
  await responsePromise;
  await expect(await explorePage.runQuery()).not.toBeOK();
});
