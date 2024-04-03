import { expect, test } from '../../../../src';
import { REDSHIFT_SCHEMAS, REDSHIFT_TABLES } from '../mocks/resource';

test('should load resources and display them as options when clicking on an input', async ({
  variableEditPage,
  page,
  readProvisionedDataSource,
}) => {
  await variableEditPage.mockResourceResponse('schemas', REDSHIFT_SCHEMAS);
  await variableEditPage.mockResourceResponse('tables', REDSHIFT_TABLES);
  const ds = await readProvisionedDataSource({ fileName: 'redshift.yaml' });
  await variableEditPage.setVariableType('Query');
  await variableEditPage.datasource.set(ds.name);
  await page.getByLabel('Schema').click();
  await expect(variableEditPage.getByGrafanaSelector('Select option')).toContainText(REDSHIFT_SCHEMAS);
  await page.keyboard.press('Enter');
  await page.getByLabel('Table').click();
  await expect(variableEditPage.getByGrafanaSelector('Select option')).toContainText(REDSHIFT_TABLES);
});
