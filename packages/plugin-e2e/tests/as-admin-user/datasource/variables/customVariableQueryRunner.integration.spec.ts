import { VariableEditPage, expect, test } from '../../../../src';

test('custom variable editor query runner should return data when query is valid', async ({
  variableEditPage,
  page,
  readProvisionedDataSource,
  selectors,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'redshift.yaml' });
  await variableEditPage.setVariableType('Query');
  await variableEditPage.datasource.set(ds.name);
  await page.waitForFunction(() => (window as any).monaco);
  await variableEditPage.getByGrafanaSelector(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select distinct(environment) from long_format_example');
  const queryDataRequest = variableEditPage.waitForQueryDataRequest();
  await variableEditPage.runQuery();
  await queryDataRequest;
  await expect(variableEditPage).toDisplayPreviews([/stag.*/, 'test']);
});

test('custom variable editor query runner should return data when valid query from provisioned dashboard is used', async ({
  readProvisionedDashboard,
  gotoVariableEditPage,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
  const variableEditPage = await gotoVariableEditPage({ dashboard, id: '2' });
  const queryDataRequest = variableEditPage.waitForQueryDataRequest();
  await variableEditPage.runQuery();
  await queryDataRequest;
  await expect(variableEditPage).toDisplayPreviews(['staging', 'test']);
});
