import { expect, test } from '../../src';
import { CLUSTERS_RESPONSE } from './mocks/resourceResponse';

test('invalid credentials', async ({ datasourceConfigPage, page }) => {
  await datasourceConfigPage.createDataSource({ type: 'grafana-googlesheets-datasource', name: 'GoogleSheetsE2E' });

  await page.getByText('API Key', { exact: true }).click();
  await page.getByPlaceholder('Enter API key').fill('xyz');

  await expect(page).toHaveTitle('Prometheus-E2E');
  //   await expect(dataSourceConfigPage.saveAndTest()).toBeOK();
});
