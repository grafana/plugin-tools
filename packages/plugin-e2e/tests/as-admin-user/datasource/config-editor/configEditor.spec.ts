import { expect, test } from '../../../../src';
import { clickRadioButton } from '../../../utils';

test('invalid credentials should return an error', async ({ createDataSourceConfigPage, page }) => {
  const configPage = await createDataSourceConfigPage({ type: 'grafana-googlesheets-datasource' });
  await clickRadioButton(page, 'API Key', { exact: true });
  await page.getByPlaceholder('Enter API key').fill('xyz');
  await expect(configPage.saveAndTest()).not.toBeOK();
});

test('valid credentials should return a 200 status code', async ({ createDataSourceConfigPage, page }) => {
  const configPage = await createDataSourceConfigPage({ type: 'grafana-googlesheets-datasource' });
  await page.getByTestId('Paste JWT button').click();
  await page.getByTestId('Configuration text area').fill(process.env.GOOGLE_JWT_FILE!.replace(/'/g, ''));
  await expect(configPage.saveAndTest()).toBeOK();
});

test('should call a custom health endpoint when healthCheckPath is provided', async ({
  createDataSourceConfigPage,
  page,
  selectors,
}) => {
  const configPage = await createDataSourceConfigPage({ type: 'marcusolsson-json-datasource' });
  const healthCheckPath = selectors.apis.DataSource.proxy(
    configPage.datasource.uid,
    configPage.datasource.id.toString()
  );
  await page.route(healthCheckPath, async (route) => {
    await route.fulfill({ status: 200, body: 'OK' });
  });
  await page.getByPlaceholder('http://localhost:8080').fill('http://localhost:8080');
  await expect(configPage.saveAndTest({ path: healthCheckPath })).toBeOK();
  await expect(configPage).toHaveAlert('success', { hasNotText: 'Datasource updated' });
});

test('existing ds instance - valid credentials should return a 200 status code', async ({
  readProvisionedDataSource,
  gotoDataSourceConfigPage,
}) => {
  const datasource = await readProvisionedDataSource({ fileName: 'google-sheets-datasource-jwt.yaml' });
  const configPage = await gotoDataSourceConfigPage(datasource.uid);
  await expect(configPage.saveAndTest()).toBeOK();
});
