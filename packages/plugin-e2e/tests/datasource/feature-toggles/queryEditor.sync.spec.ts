import { expect, test } from '../../../src';
import { ProvisionFile } from '../../../src/types';

test('standard query data handler should only be called once', async ({
  panelEditPage,
  page,
  selectors,
  readProvision,
}) => {
  const requestListener = (request) => request.url().includes(selectors.apis.DataSource.query) && calledTimes++;

  const provisionFile = await readProvision<ProvisionFile>({ filePath: 'datasources/redshift.yaml' });
  await panelEditPage.datasource.set(provisionFile.datasources[0].name!);
  await panelEditPage.timeRange.set({ from: '2020-01-31', to: '2020-02-20' });
  await page.waitForFunction(() => (window as any).monaco);
  await panelEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();

  await page.keyboard.insertText('select * from long_format_example limit 100');
  let calledTimes = 0;
  page.on('request', requestListener);
  await expect(panelEditPage.refreshPanel()).toBeOK();
  await page.waitForTimeout(2000);
  await expect(calledTimes).toBe(1);
  page.off('request', requestListener);
});
