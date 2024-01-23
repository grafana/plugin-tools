import { expect, test } from '../../../src';
import { ProvisionFile } from '../../../src/types';

// override the feature toggles defined in playwright.config.ts only for tests in this file
test.use({
  featureToggles: {
    redshiftAsyncQueryDataSupport: true,
  },
});

test('async query data handler should return a `finished` status', async ({
  selectors,
  panelEditPage,
  page,
  readProvision,
}) => {
  const provisionFile = await readProvision<ProvisionFile>({ filePath: 'datasources/redshift.yaml' });
  await panelEditPage.datasource.set(provisionFile.datasources[0].name!);
  await panelEditPage.timeRange.set({ from: '2020-01-31', to: '2020-02-20' });
  await page.waitForFunction(() => (window as any).monaco);
  await panelEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select * from long_format_example limit 100');
  await expect(
    panelEditPage.refreshPanel({
      waitForResponsePredicateCallback: (r) =>
        r.url().includes(selectors.apis.DataSource.query) &&
        r.body().then((body) => body.includes(`"status":"finished"`)),
    })
  ).toBeOK();
});
