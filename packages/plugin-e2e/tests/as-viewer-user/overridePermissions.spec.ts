import { expect, resolveGrafanaSelector, test } from '../../src';

// override project user only for tests in this file
test.use({ storageState: 'playwright/.auth/admin.json', user: { user: 'admin', password: 'admin' } });

test('should not redirect to start page when permissions to navigate to page is exist', async ({
  page,
  readProvisionedDataSource,
  selectors,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await page.goto('/datasources');
  test.skip(page.url().includes('/login'), 'auth state not valid in this environment');
  // wait for the list to render so a client-side redirect would already have happened
  await expect(page.locator(resolveGrafanaSelector(selectors.pages.DataSources.dataSources(ds.name)))).toBeVisible();
  await expect(page).toHaveURL(/\/datasources$/);
});
