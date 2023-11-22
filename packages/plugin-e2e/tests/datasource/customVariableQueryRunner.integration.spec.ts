import { expect, test } from '../../src';
import { ProvisionFile } from '../../src/types';

test('custom variable editor query runner', async ({ variableEditPage, page, readProvision }) => {
  const cloudwatchDataSource = await readProvision<ProvisionFile>({
    filePath: 'datasources/cloudwatch.yaml',
  }).then((provision) => provision.datasources?.[0]!);
  await variableEditPage.setVariableType('Query');
  await variableEditPage.datasource.set(cloudwatchDataSource.name!);
  await page.getByLabel('Query type').click();
  await page.getByText('Namespaces').click();
  await variableEditPage.runQuery();
  await expect(variableEditPage).toDisplayPreviews(['AWS/ACMPrivateCA', /AWS\/Back.*/]);
});
