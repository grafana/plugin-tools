import * as semver from 'semver';
import { expect, test } from '../../../../src';

const TRUTHY_CUSTOM_TOGGLE = 'custom_toggle1';
const FALSY_CUSTOM_TOGGLE = 'custom_toggle2';

// override the feature toggles defined in playwright.config.ts only for tests in this file
test.use({
  featureToggles: {
    tlsEnabled: true,
    [TRUTHY_CUSTOM_TOGGLE]: true,
    [FALSY_CUSTOM_TOGGLE]: false,
  },
});

test('should set feature toggles correctly', async ({ isFeatureToggleEnabled }) => {
  expect(await isFeatureToggleEnabled(TRUTHY_CUSTOM_TOGGLE)).toBeTruthy();
  expect(await isFeatureToggleEnabled(FALSY_CUSTOM_TOGGLE)).toBeFalsy();
});

test('should display TLS enabled field when tlsEnabled feature toggle is set to true', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  grafanaVersion,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
  const row = panelEditPage.getQueryEditorRow('A');
  const locator = semver.lt(grafanaVersion, '9.3.0')
    ? row.locator(`[label="TLS Enabled"]`).locator('../label')
    : row.getByLabel('TLS Enabled');
  await expect(locator).toBeVisible();
});
