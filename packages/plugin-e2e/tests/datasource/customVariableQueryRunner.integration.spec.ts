import { expect, test } from '../../src';
import { ProvisionFile } from '../../src/types';

test('custom variable editor query runner', async ({ variableEditPage, page, readProvision, selectors }) => {
  const ds = await readProvision<ProvisionFile>({ filePath: 'datasources/redshift.yaml' }).then(
    (provision) => provision.datasources?.[0]!
  );
  await variableEditPage.setVariableType('Query');
  await variableEditPage.datasource.set(ds.name!);
  await page.waitForFunction(() => (window as any).monaco);
  await variableEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select distinct(environment) from long_format_example');
  await variableEditPage.runQuery();
  await expect(variableEditPage).toDisplayPreviews([/stag.*/, 'test']);
});
