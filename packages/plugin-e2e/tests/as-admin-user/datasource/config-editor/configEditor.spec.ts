import { expect, test } from '../../../../src';

test('should render config editor', async ({ createDataSourceConfigPage, readProvisionedDataSource, page }) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await createDataSourceConfigPage({ type: ds.type });
  await expect(page.getByLabel('Path')).toBeVisible();
});

test('should be successful if config is valid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  const datasourceConfigPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByLabel('Path').fill('example.com');
  await expect(datasourceConfigPage.saveAndTest()).toBeOK();
  await expect(datasourceConfigPage).toHaveAlert('success');
});

test('should return error if API key is missing', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  const datasourceConfigPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByLabel('Path').fill('');
  await expect(datasourceConfigPage.saveAndTest()).not.toBeOK();
  await expect(datasourceConfigPage).toHaveAlert('error', { hasText: 'API key is missing' });
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
