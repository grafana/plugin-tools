import { expect, test } from '../../../src';
import { ProvisionFile } from '../../../src/types';

test('custom variable editor query runner', async ({ variableEditPage, page, readProvision, selectors }) => {
  const provision = await readProvision<ProvisionFile>({ filePath: 'datasources/redshift.yaml' });
  await variableEditPage.setVariableType('Query');
  await variableEditPage.datasource.set(provision.datasources?.[0]!.name!);
  await page.waitForFunction(() => (window as any).monaco);
  await variableEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select distinct(environment) from long_format_example');
  await variableEditPage.runQuery();
  await expect(variableEditPage).toDisplayPreviews([/stag.*/, 'test']);
});
