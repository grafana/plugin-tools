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

test('should display TLS enabled field when tlsEnabled feature toggle is set to true', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'test-datasource.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
  await expect(panelEditPage.getQueryEditorRow('A').getByLabel('TLS Enabled')).toBeVisible();
});
