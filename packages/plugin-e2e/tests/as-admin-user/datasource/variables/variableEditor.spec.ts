import { expect, test } from '../../../../src';

test('should render variable editor', async ({ variableEditPage, page, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await variableEditPage.datasource.set(ds.name);
  await expect(page.getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

test('create new variable and execute successful query', async ({
  variableEditPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await variableEditPage.datasource.set(ds.name);
  await page.getByRole('textbox', { name: 'Query Text' }).fill('annotationQuery');
  const queryDataRequest = variableEditPage.waitForQueryDataRequest();
  await variableEditPage.runQuery();
  await queryDataRequest;
  await expect(variableEditPage).toDisplayPreviews(['A', 'B']);
});

test('open existing variable and execute successful query', async ({
  gotoVariableEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const variableEditPage = await gotoVariableEditPage({ dashboard, id: '0' });
  const queryDataRequest = variableEditPage.waitForQueryDataRequest();
  await variableEditPage.runQuery();
  await queryDataRequest;
  await expect(variableEditPage).toDisplayPreviews(['A', 'B']);
});
