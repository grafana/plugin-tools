import { expect, test } from '../../../src';
import { ProvisionFile } from '../../../src/types';

test.use({
  featureToggles: {
    redshiftAsyncQueryDataSupport: false,
  },
});

test('standard query data handler', async ({ selectors, panelEditPage, page, readProvision }) => {
  const provisionFile = await readProvision<ProvisionFile>({ filePath: 'datasources/redshift.yaml' });
  await panelEditPage.datasource.set(provisionFile.datasources[0].name!);
  await panelEditPage.timeRange.set({ from: '2020-01-31', to: '2020-02-20' });
  await page.waitForFunction(() => (window as any).monaco);
  await panelEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select * from long_format_example limit 100');
  await expect(panelEditPage.refreshPanel()).toBeOK();
});
