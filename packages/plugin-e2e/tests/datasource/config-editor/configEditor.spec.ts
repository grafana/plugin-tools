import { Page } from '@playwright/test';
import { expect, test } from '../../../src';
import { clickRadioButton } from '../../utils';

test('invalid credentials should return an error', async ({ createDataSourceConfigPage, page }) => {
  const configPage = await createDataSourceConfigPage({ type: 'grafana-googlesheets-datasource' });
  await clickRadioButton(page, 'API Key', { exact: true });
  await page.getByPlaceholder('Enter API key').fill('xyz');
  await expect(await configPage.saveAndTest()).not.toBeOK();
});

test('valid credentials should return a 200 status code', async ({ createDataSourceConfigPage, page }) => {
  const configPage = await createDataSourceConfigPage({ type: 'grafana-googlesheets-datasource' });
  await page.getByTestId('Paste JWT button').click();
  await page.getByTestId('Configuration text area').fill(process.env.GOOGLE_JWT_FILE!.replace(/'/g, ''));
  await expect(await configPage.saveAndTest()).toBeOK();
});

test('valid credentials should display a success alert on the page', async ({ createDataSourceConfigPage, page }) => {
  const configPage = await createDataSourceConfigPage({ type: 'testdata' });
  await configPage.saveAndTest({ skipWaitForResponse: true });
  await expect(configPage).toHaveAlert('success', { hasNotText: 'Datasource updated' });
});
