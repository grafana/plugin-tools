import { expect, test } from '../../../src';
import { ProvisionFile } from '../../../src/types';

test('query data handler', async ({ selectors, panelEditPage, page, readProvision, isFeatureToggleEnabled }) => {
  const provisionFile = await readProvision<ProvisionFile>({ filePath: 'datasources/redshift.yaml' });
  await panelEditPage.datasource.set(provisionFile.datasources[0].name!);
  await panelEditPage.timeRange.set({ from: '2020-01-31', to: '2020-02-20' });

  await page.waitForFunction(() => (window as any).monaco);
  await panelEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select * from long_format_example limit 100');

  const asyncQueryDataHandlerEnabled = await isFeatureToggleEnabled('redshiftAsyncQueryDataSupport');
  if (asyncQueryDataHandlerEnabled) {
    // the async query data handler polls the backend until it receives a status of "finished"
    const queryStatedResponse = panelEditPage.waitForQueryDataResponse(
      (response) => response.ok() && response.body().then((body) => body.includes(`"status":"started"`))
    );
    const queryFinishedResponse = panelEditPage.waitForQueryDataResponse(
      (response) => response.ok() && response.body().then((body) => body.includes(`"status":"finished"`))
    );
    await panelEditPage.refreshPanel();
    await expect(await queryStatedResponse).toBeTruthy();
    await expect(await queryFinishedResponse).toBeTruthy();
  } else {
    await expect(await panelEditPage.refreshPanel()).toBeOK();
  }
});
