import { expect, test } from '../../../../src';

const TRUTHY_CUSTOM_TOGGLE = 'custom_toggle1';
const FALSY_CUSTOM_TOGGLE = 'custom_toggle2';

// override the feature toggles defined in playwright.config.ts only for tests in this file
test.use({
  featureToggles: {
    redshiftAsyncQueryDataSupport: true,
    [TRUTHY_CUSTOM_TOGGLE]: true,
    [FALSY_CUSTOM_TOGGLE]: false,
  },
});

test('should set feature toggles correctly', async ({ isFeatureToggleEnabled }) => {
  expect(await isFeatureToggleEnabled(TRUTHY_CUSTOM_TOGGLE)).toBeTruthy();
  expect(await isFeatureToggleEnabled(FALSY_CUSTOM_TOGGLE)).toBeFalsy();
});

test('async query data handler should return a `finished` status', async ({
  selectors,
  panelEditPage,
  page,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'redshift.yaml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.timeRange.set({ from: '2020-01-31', to: '2020-02-20' });
  await page.waitForFunction(() => (window as any).monaco);
  await panelEditPage.getByGrafanaSelector(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select * from long_format_example limit 100');
  await expect(
    panelEditPage.refreshPanel({
      waitForResponsePredicateCallback: (r) =>
        r.url().includes(selectors.apis.DataSource.query) &&
        r.body().then((body) => body.includes(`"status":"finished"`)),
    })
  ).toBeOK();
});
