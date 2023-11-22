import { expect, test } from '../../src';
import { ProvisionFile } from '../../src/types';
import { CLOUDWATCH_NAMESPACES, CLOUDWATCH_REGIONS } from './mocks/resource';

const toMetricFindOption = (text: string) => ({
  text,
  value: text,
  label: text,
});

test('query type `Metrics` should load regions and namespaces and display them in dropdown', async ({
  variableEditPage,
  page,
  readProvision,
}) => {
  await variableEditPage.mockResourceResponse('regions', CLOUDWATCH_REGIONS.map(toMetricFindOption));
  await variableEditPage.mockResourceResponse('namespaces', CLOUDWATCH_NAMESPACES.map(toMetricFindOption));
  const cloudwatchDataSource = await readProvision<ProvisionFile>({
    filePath: 'datasources/cloudwatch.yaml',
  }).then((provision) => provision.datasources?.[0]!);
  await variableEditPage.setVariableType('Query');
  await variableEditPage.datasource.set(cloudwatchDataSource.name!);
  await page.getByLabel('Query type').fill('Metrics');
  await page.keyboard.press('Enter');
  await page.getByLabel('Region').click();
  await expect(variableEditPage.getByTestIdOrAriaLabel('Select option')).toContainText(CLOUDWATCH_REGIONS);
  await page.keyboard.press('Escape');
  await page.getByLabel('Namespace').click();
  await expect(variableEditPage.getByTestIdOrAriaLabel('Select option')).toContainText(CLOUDWATCH_NAMESPACES);
});
