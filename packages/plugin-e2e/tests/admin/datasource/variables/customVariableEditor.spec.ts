import { expect, test } from '../../../../src';
import { ProvisionFile } from '../../../src/types';
import { REDSHIFT_SCHEMAS, REDSHIFT_TABLES } from '../mocks/resource';

test('should load resources and display them as options when clicking on an input', async ({
  variableEditPage,
  page,
  readProvision,
}) => {
  await variableEditPage.mockResourceResponse('schemas', REDSHIFT_SCHEMAS);
  await variableEditPage.mockResourceResponse('tables', REDSHIFT_TABLES);
  const provision = await readProvision<ProvisionFile>({ filePath: 'datasources/redshift.yaml' });
  await variableEditPage.setVariableType('Query');
  await variableEditPage.datasource.set(provision.datasources?.[0]!.name!);
  await page.getByLabel('Schema').click();
  await expect(variableEditPage.getByTestIdOrAriaLabel('Select option')).toContainText(REDSHIFT_SCHEMAS);
  await page.keyboard.press('Enter');
  await page.getByLabel('Table').click();
  await expect(variableEditPage.getByTestIdOrAriaLabel('Select option')).toContainText(REDSHIFT_TABLES);
});
