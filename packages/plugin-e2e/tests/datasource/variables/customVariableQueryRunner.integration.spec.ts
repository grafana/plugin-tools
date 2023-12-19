import { VariableEditPage, expect, test } from '../../../src';
import { Dashboard, ProvisionFile } from '../../../src/types';

test('custom variable editor query runner should return data when query is valid', async ({
  variableEditPage,
  page,
  readProvision,
  selectors,
}) => {
  const provision = await readProvision<ProvisionFile>({ filePath: 'datasources/redshift.yaml' });
  await variableEditPage.setVariableType('Query');
  await variableEditPage.datasource.set(provision.datasources?.[0]!.name!);
  await page.waitForFunction(() => (window as any).monaco);
  await variableEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select distinct(environment) from long_format_example');
  const queryDataRequest = variableEditPage.waitForQueryDataRequest();
  await variableEditPage.runQuery();
  await queryDataRequest;
  await expect(variableEditPage).toDisplayPreviews([/stag.*/, 'test']);
});

test('custom variable editor query runner should return data when valid query from provisioned dashboard is used', async ({
  request,
  page,
  selectors,
  grafanaVersion,
  readProvision,
}) => {
  const provision = await readProvision<Dashboard>({ filePath: 'dashboards/redshift.json' });
  const variableEditPage = new VariableEditPage(
    { request, page, selectors, grafanaVersion },
    { dashboard: { uid: provision.uid }, id: '2' }
  );
  await variableEditPage.goto();
  const queryDataRequest = variableEditPage.waitForQueryDataRequest();
  await variableEditPage.runQuery();
  await queryDataRequest;
  await expect(variableEditPage).toDisplayPreviews(['staging', 'test']);
});
